import { FileProcessingArea } from '@/components/feature/file-processing-area';
import { Notebook } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-background font-body text-foreground">
      <div className="container mx-auto flex max-w-4xl flex-col items-center p-4 py-8 sm:p-8 sm:py-12 md:p-12 md:py-16">
        <header className="mb-8 text-center sm:mb-12">
          <Notebook className="mx-auto mb-4 h-16 w-16 text-primary" strokeWidth={1.5} />
          <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
            KeepSync
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Convert your Google Keep notes to Obsidian-compatible Markdown.
            Select your Google Takeout folder and let us handle the rest.
          </p>
        </header>
        <FileProcessingArea />
      </div>
    </main>
  );
}
