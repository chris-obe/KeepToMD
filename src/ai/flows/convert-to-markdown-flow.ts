'use server';
/**
 * @fileOverview A flow for converting Google Keep HTML files to Obsidian-compatible Markdown.
 *
 * - convertToMarkdown - A function that handles the conversion process.
 * - ConvertToMarkdownInput - The input type for the convertToMarkdown function.
 * - ConvertToMarkdownOutput - The return type for the convertToMarkdown function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { format } from 'date-fns';

const turndownService = new TurndownService();

// Schemas based on the UI controls
const NamingOptionsSchema = z.object({
  useTitle: z.boolean(),
  useBody: z.boolean(),
  bodyCharCount: z.number(),
  useDate: z.boolean(),
  useTime: z.boolean(),
  useSerial: z.boolean(),
  datePosition: z.enum(['prepend', 'append']),
  serialPadding: z.enum(['1', '01', '001', '0001']),
});

const FormattingOptionsSchema = z.object({
  tagHandling: z.enum(['links', 'hash', 'atlinks']),
});

export const ConvertToMarkdownInputSchema = z.object({
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
  })),
  namingOptions: NamingOptionsSchema,
  formattingOptions: FormattingOptionsSchema,
});
export type ConvertToMarkdownInput = z.infer<typeof ConvertToMarkdownInputSchema>;

export const ConvertToMarkdownOutputSchema = z.object({
  convertedFiles: z.array(z.object({
    originalPath: z.string(),
    newPath: z.string(),
    content: z.string(),
  })),
});
export type ConvertToMarkdownOutput = z.infer<typeof ConvertToMarkdownOutputSchema>;


/**
 * Parses a single HTML file content from Google Keep.
 */
function parseKeepHtml(htmlContent: string) {
  const $ = cheerio.load(htmlContent);

  const title = $('.title').text().trim() || null;
  const creationTimeText = $('.heading').text().trim();
  
  let creationTime = new Date(); // Default to now if parsing fails
  if (creationTimeText) {
    try {
      // The date format is like "Mon, 23 Oct 2023, 19:54:15 UTC"
      // We need to handle this format. Let's try parsing it.
      // JS Date constructor can be quite forgiving.
      const parsedDate = new Date(creationTimeText.replace(/, /g, ' '));
      if (!isNaN(parsedDate.getTime())) {
        creationTime = parsedDate;
      }
    } catch (e) {
      console.error(`Could not parse date: ${creationTimeText}`);
    }
  }

  const tags = $('.chips .label-name').map((i, el) => $(el).text().trim()).get();
  const contentHtml = $('.content').html() || '';
  const content = turndownService.turndown(contentHtml);

  const attachments = $('.attachments img').map((i, el) => $(el).attr('src')).get();

  return {
    title,
    creationTime,
    tags,
    content,
    attachments,
  };
}

function formatTag(tag: string, format: 'links' | 'hash' | 'atlinks'): string {
    switch (format) {
        case 'links':
            return `[[${tag}]]`;
        case 'hash':
            return `#${tag.replace(/\s+/g, '-')}`;
        case 'atlinks':
            return `@${tag}`;
    }
}


/**
 * Converts extracted data into Markdown format.
 */
function formatMarkdown(data: ReturnType<typeof parseKeepHtml>, formattingOptions: z.infer<typeof FormattingOptionsSchema>) {
  const markdown = [];
  markdown.push(`# ${data.title || 'Untitled'}\n`);
  markdown.push(`**Created:** ${format(data.creationTime, 'yyyy-MM-dd HH:mm:ss')}\n`);
  if (data.tags.length > 0) {
    const formattedTags = data.tags.map(tag => formatTag(tag, formattingOptions.tagHandling));
    markdown.push(`**Tags:** ${formattedTags.join(' ')}\n`);
  }
  markdown.push(`${data.content}\n`);
  if (data.attachments.length > 0) {
    for (const attachment of data.attachments) {
      const filename = attachment.split('/').pop();
      markdown.push(`![[${filename}]]`);
    }
  }
  return markdown.join('\n');
}

/**
 * Creates the filename for the markdown file.
 */
function createFilename(data: ReturnType<typeof parseKeepHtml>, options: z.infer<typeof NamingOptionsSchema>, serial: number): string {
  const parts: string[] = [];

  if (options.useTitle && data.title) {
    parts.push(data.title.replace(/[\\/]/g, '-'));
  }
  if (options.useBody && !data.title) {
    const cleanContent = data.content.replace(/\s+/g, ' ').trim();
    parts.push(cleanContent.substring(0, options.bodyCharCount));
  }
  
  const datePart = options.useDate ? format(data.creationTime, 'yyyy-MM-dd') : '';
  const timePart = options.useTime ? format(data.creationTime, 'HH-mm-ss') : '';
  const dateTimePart = [datePart, timePart].filter(Boolean).join('_');
  
  if (dateTimePart) {
      if (options.datePosition === 'prepend') {
          parts.unshift(dateTimePart);
      } else {
          parts.push(dateTimePart);
      }
  }

  if (options.useSerial) {
    const padding = parseInt(options.serialPadding, 10).toString().length;
    parts.push(serial.toString().padStart(padding, '0'));
  }

  return parts.join(' - ').replace(/\s+/g, ' ').trim() + '.md';
}


const convertToMarkdownFlow = ai.defineFlow(
  {
    name: 'convertToMarkdownFlow',
    inputSchema: ConvertToMarkdownInputSchema,
    outputSchema: ConvertToMarkdownOutputSchema,
  },
  async (input) => {
    const convertedFiles: z.infer<typeof ConvertToMarkdownOutputSchema>['convertedFiles'] = [];
    
    // Sort files by creation date if date is used for naming, to have proper serial numbers
    const filesWithData = input.files.map(file => {
      const data = parseKeepHtml(file.content);
      return { file, data };
    });

    if (input.namingOptions.useDate) {
      filesWithData.sort((a, b) => a.data.creationTime.getTime() - b.data.creationTime.getTime());
    }

    filesWithData.forEach((fileWithData, index) => {
      const { file, data } = fileWithData;
      const markdownContent = formatMarkdown(data, input.formattingOptions);
      const newFilename = createFilename(data, input.namingOptions, index + 1);

      convertedFiles.push({
        originalPath: file.path,
        newPath: newFilename,
        content: markdownContent,
      });
    });

    return { convertedFiles };
  }
);

export async function convertToMarkdown(input: ConvertToMarkdownInput): Promise<ConvertToMarkdownOutput> {
  return convertToMarkdownFlow(input);
}
