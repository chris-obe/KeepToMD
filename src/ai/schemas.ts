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
  useSerial: z.boolean(),
  datePosition: z.enum(['prepend', 'append']),
  serialPadding: z.enum(['1', '01', '001', '0001']),
});
export type NamingOptions = z.infer<typeof NamingOptionsSchema>;


export const FormattingOptionsSchema = z.object({
  tagHandling: z.enum(['links', 'hash', 'atlinks']),
});
export type FormattingOptions = z.infer<typeof FormattingOptionsSchema>;


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
