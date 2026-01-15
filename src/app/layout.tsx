import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import { ConversionProvider } from '@/components/feature/conversion-context';
import { ApiSetupDialog } from '@/components/feature/api-setup-dialog';

export const metadata: Metadata = {
  title: 'KeepToMD - Convert Google Keep to Obsidian',
  description: 'Effortlessly convert your Google Keep notes to Obsidian-compatible Markdown.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,opsz@0,8..144;1,8..144&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ConversionProvider>
            <ApiSetupDialog autoOpen={false} />
            {children}
            <Toaster />
          </ConversionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
