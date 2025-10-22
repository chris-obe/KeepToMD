import { z } from 'zod';

// Schemas based on the UI controls
export const NamingOptionsSchema = z.object({
  useTitle: z.boolean(),
  useBody: z.boolean(),
  bodyLength: z.number(),
  bodyUnit: z.enum(['characters', 'words', 'lines']),
  useDate: z.boolean(),
  dateFormat: z.string(),
  useTime: z.boolean(),
  timeFormat: z.string(),
  datePosition: z.enum(['prepend', 'append']),
  useSerial: z.boolean(),
  serialPadding: z.enum(['1', '01', '001', '0001']),
  useEmoji: z.boolean(),
  selectedEmoji: z.string(),
  emojiPosition: z.enum(['beforeDate', 'afterDate', 'afterTitle']),
  fillerText: z.string(),
});
export type NamingOptions = z.infer<typeof NamingOptionsSchema>;


export const FormattingOptionsSchema = z.object({
  tagHandling: z.enum(['links', 'hash', 'atlinks']),
});
export type FormattingOptions = z.infer<typeof FormattingOptionsSchema>;


export const ConvertToMarkdownOutputSchema = z.object({
  convertedFiles: z.array(z.object({
    originalPath: z.string(),
    newPath: z.string(),
    content: z.string(),
  })),
});
export type ConvertToMarkdownOutput = z.infer<typeof ConvertToMarkdownOutputSchema>;

    