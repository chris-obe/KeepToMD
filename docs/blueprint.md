# **App Name**: KeepToMD

Local Keep bridge repo: `https://github.com/chris-obe/KeepToMD.bridge` (folder name: `KeepToMD-bridge`).

## Core Features:

- Data Upload: Accept a folder upload from the user, which contains their Google Keep takeout data.
- Data Parsing: Parse all the HTML files, images, and audio recordings from the Google Keep Takeout data.
- Metadata Extraction: Extract date metadata, note titles, and other information for use in the conversion to markdown.
- Markdown Conversion: Transform each Google Keep note into an Obsidian-compatible markdown file, retaining references to multimedia.
- Markdown Package Download: Allow users to download all files, post conversion.

## Style Guidelines:

- Primary color: A calm and muted blue (#6699CC), evocative of organization and clarity.
- Background color: Light gray (#F0F0F0) for a clean and unobtrusive interface.
- Accent color: A warm orange (#FFB347) to highlight key actions and notifications.
- Font pairing: 'Inter' (sans-serif) for body text and 'Literata' (serif) for headings. 'Inter' will allow the markdown to remain clean and 'Literata' will draw more attention to important header data
- Use simple, consistent icons to represent file types and actions (e.g., download, upload, convert).
- Emphasize clean lines and good spacing. Make it obvious where a user uploads a folder, and receives converted files
