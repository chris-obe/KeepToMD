import * as cheerio from 'cheerio';
import { format } from 'date-fns';
import TurndownService from 'turndown';
import type { FormattingOptions, NamingOptions } from '@/ai/schemas';

const turndownService = new TurndownService();

export type ParsedKeepNote = {
  title: string | null;
  creationTime: Date;
  tags: string[];
  content: string;
  attachments: string[];
};

/**
 * Parses a single HTML file content from Google Keep.
 */
export function parseKeepHtml(htmlContent: string): ParsedKeepNote {
  const $ = cheerio.load(htmlContent);

  const title = $('.title').text().trim() || null;
  const creationTimeText = $('.heading').text().trim();

  let creationTime = new Date(); // Default to now if parsing fails
  if (creationTimeText) {
    try {
      // The date format is like "Mon, 23 Oct 2023, 19:54:15 UTC"
      const parsedDate = new Date(creationTimeText.replace(/, /g, ' '));
      if (!isNaN(parsedDate.getTime())) {
        creationTime = parsedDate;
      }
    } catch (e) {
      console.error(`Could not parse date: ${creationTimeText}`);
    }
  }

  const tags = $('.chips .label-name')
    .map((i, el) => $(el).text().trim())
    .get();
  const contentHtml = $('.content').html() || '';
  const content = turndownService.turndown(contentHtml);

  const attachments = $('.attachments img')
    .map((i, el) => $(el).attr('src'))
    .get();

  return {
    title,
    creationTime,
    tags,
    content,
    attachments,
  };
}

function formatTag(tag: string, formatStyle: FormattingOptions['tagHandling']): string {
  switch (formatStyle) {
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
export function formatMarkdown(
  data: ParsedKeepNote,
  formattingOptions: FormattingOptions,
) {
  const markdown = [];
  markdown.push(`# ${data.title || 'Untitled'}\n`);
  markdown.push(`**Created:** ${format(data.creationTime, 'yyyy-MM-dd HH:mm:ss')}\n`);
  if (data.tags.length > 0) {
    const formattedTags = data.tags.map((tag) =>
      formatTag(tag, formattingOptions.tagHandling),
    );
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

type BuildFilenameOptions = {
  note: ParsedKeepNote;
  options: NamingOptions;
  serial: number;
  now?: Date;
  fallbackTitle?: string;
};

/**
 * Creates the filename for the markdown file.
 */
export function buildFilename({
  note,
  options,
  serial,
  now = new Date(),
  fallbackTitle = 'Untitled',
}: BuildFilenameOptions): string {
  const parts: string[] = [];

  const emojiPart = options.useEmoji ? options.selectedEmoji : '';

  const datePart = options.useDate ? format(note.creationTime, options.dateFormat) : '';
  const timePart = options.useTime ? format(now, options.timeFormat) : '';
  let dateTimePart = [datePart, timePart].filter(Boolean).join('_');

  let effectiveEmojiPosition = options.emojiPosition;
  if (!options.useDate) {
    effectiveEmojiPosition = 'afterTitle';
  }

  if (dateTimePart && options.datePosition === 'prepend') {
    if (options.useEmoji && effectiveEmojiPosition === 'beforeDate') {
      dateTimePart = `${emojiPart} ${dateTimePart}`;
    }
    if (options.useEmoji && effectiveEmojiPosition === 'afterDate') {
      dateTimePart = `${dateTimePart} ${emojiPart}`;
    }
    parts.unshift(dateTimePart);
  }

  let titlePart = '';
  if (options.useTitle && note.title) {
    titlePart = note.title;
  } else if (options.useBody && !note.title) {
    const cleanContent = note.content.replace(/\s+/g, ' ').trim();
    let snippet = '';
    if (options.bodyUnit === 'characters') {
      snippet = cleanContent.substring(0, options.bodyLength);
    } else if (options.bodyUnit === 'words') {
      snippet = cleanContent.split(/\s+/).slice(0, options.bodyLength).join(' ');
    } else {
      snippet = note.content
        .split('\n')
        .slice(0, options.bodyLength)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    titlePart = snippet;
  }

  if (!titlePart) {
    titlePart = options.fillerText || fallbackTitle;
  }

  titlePart = titlePart.replace(/[\\/]/g, '-'); // Sanitize

  if (options.useEmoji && effectiveEmojiPosition === 'afterTitle') {
    titlePart = `${titlePart} ${emojiPart}`;
  }
  parts.push(titlePart);

  if (dateTimePart && options.datePosition === 'append') {
    if (options.useEmoji && effectiveEmojiPosition === 'beforeDate') {
      dateTimePart = `${emojiPart} ${emojiPart}`;
    }
    if (options.useEmoji && effectiveEmojiPosition === 'afterDate') {
      dateTimePart = `${dateTimePart} ${emojiPart}`;
    }
    parts.push(dateTimePart);
  }

  if (options.useSerial && options.useDate) {
    const padding = parseInt(options.serialPadding, 10).toString().length;
    parts.push(serial.toString().padStart(padding, '0'));
  }

  return parts.join(' - ').replace(/\s+/g, ' ').trim() + '.md';
}

type BuildPreviewOptions = {
  options: NamingOptions;
  firstNoteTitle: string;
  bodyPreview: string;
  now?: Date;
};

export function buildFilenamePreview({
  options,
  firstNoteTitle,
  bodyPreview,
  now = new Date(),
}: BuildPreviewOptions): string {
  const title =
    options.useTitle && firstNoteTitle !== 'My Note Title' ? firstNoteTitle : null;
  const note: ParsedKeepNote = {
    title,
    creationTime: now,
    tags: [],
    content: bodyPreview,
    attachments: [],
  };

  return buildFilename({
    note,
    options,
    serial: 1,
    now,
    fallbackTitle: 'My Note Title',
  });
}
