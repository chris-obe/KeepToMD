"use client";

import { useState, useRef, type ChangeEvent, useCallback } from 'react';
import { Upload, FileText, FileImage, FileAudio, Loader2, Download, AlertCircle, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

type ProcessedFile = {
  name: string;
  type: 'md' | 'media';
  originalFile?: File;
  content?: string;
  icon: React.ReactNode;
};

type Status = 'idle' | 'processing' | 'success' | 'error';

export function FileProcessingArea() {
  const [status, setStatus] = useState<Status>('idle');
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setStatus('idle');
    setProcessedFiles([]);
    setError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleDownload = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    const markdownFiles = processedFiles.filter(f => f.type === 'md' && f.content);
    if(markdownFiles.length === 0) return;
    
    markdownFiles.forEach((file, index) => {
      setTimeout(() => {
        handleDownload(file.content!, file.name);
      }, index * 200);
    });

    toast({
      title: "Downloads Started",
      description: "Your browser may ask for permission to download multiple files.",
    });
  };

  const processFiles = useCallback(async (files: File[]) => {
    setStatus('processing');
    setProcessedFiles([]);
    setError(null);

    const htmlFiles = files.filter(file => file.name.endsWith('.html'));
    const mediaFiles = files.filter(file => !file.name.endsWith('.html') && !file.name.endsWith('.json'));

    if (htmlFiles.length === 0) {
      setError("No HTML files found. Please make sure you've selected a valid Google Keep Takeout folder.");
      setStatus('error');
      return;
    }

    const newProcessedFiles: ProcessedFile[] = [];

    for (const file of htmlFiles) {
      try {
        const htmlContent = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        const title = doc.querySelector('.title')?.textContent?.trim() || 'Untitled Note';
        
        let creationDate = '';
        const headingEl = doc.querySelector('.heading');
        if (headingEl?.textContent) {
          try {
            const date = new Date(headingEl.textContent);
            if (!isNaN(date.getTime())) {
              creationDate = date.toISOString().split('T')[0];
            }
          } catch (e) { /* Ignore invalid date format */ }
        }
        
        const newTitle = creationDate ? `${creationDate} - ${title}` : title;

        let markdownBody = '';
        const contentEl = doc.querySelector('.content');
        if (contentEl) {
            Array.from(contentEl.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    if(node.textContent?.trim()) markdownBody += node.textContent.trim() + '\n\n';
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as HTMLElement;
                     if (element.tagName === 'DIV') { 
                        if(element.textContent?.trim()) markdownBody += element.textContent.trim() + '\n\n';
                    } else if (element.tagName === 'UL' && element.classList.contains('list')) {
                        element.querySelectorAll('li.listitem').forEach(item => {
                            const checkbox = item.querySelector('input[type="checkbox"]');
                            const textSpan = item.querySelector('span.text');
                            if (checkbox && textSpan) {
                                const isChecked = checkbox.hasAttribute('checked');
                                markdownBody += `- [${isChecked ? 'x' : ' '}] ${textSpan.textContent?.trim()}\n`;
                            }
                        });
                        markdownBody += '\n';
                    }
                }
            });
        }
        
        const attachmentsEl = doc.querySelector('.attachments');
        if(attachmentsEl) {
            attachmentsEl.querySelectorAll('a').forEach(link => {
                const src = link.getAttribute('href');
                if (src) {
                    const fileName = decodeURIComponent(src.split('/').pop() || '');
                    markdownBody += `![[${fileName}]]\n`;
                }
            });
        }
        
        const fullMarkdown = `# ${newTitle}\n\n${markdownBody.trim()}`;
        const newFileName = file.name.replace(/\.html$/, '.md');
        
        newProcessedFiles.push({ name: newFileName, type: 'md', content: fullMarkdown, icon: <FileText className="h-5 w-5 text-primary" /> });

      } catch (e) {
        console.error("Failed to process file:", file.name, e);
      }
    }
    
    mediaFiles.forEach(file => {
      let icon = <FileText className="h-5 w-5 text-muted-foreground" />;
      if (file.type.startsWith('image/')) icon = <FileImage className="h-5 w-5 text-green-600" />;
      if (file.type.startsWith('audio/')) icon = <FileAudio className="h-5 w-5 text-purple-600" />;
      newProcessedFiles.push({ name: file.name, type: 'media', originalFile: file, icon });
    });

    setProcessedFiles(newProcessedFiles);
    setStatus('success');
  }, [toast]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center text-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Processing your notes...</p>
            <p className="text-sm text-muted-foreground">This may take a moment for large exports.</p>
          </div>
        );
      case 'success':
        const mdFiles = processedFiles.filter(f => f.type === 'md');
        const media = processedFiles.filter(f => f.type === 'media');
        return (
          <>
            <CardHeader className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
              <CardTitle className="font-headline text-2xl">Conversion Complete!</CardTitle>
              <CardDescription>
                We've converted {mdFiles.length} notes. Download your new Markdown files below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Markdown Notes ({mdFiles.length})</h3>
                  <ScrollArea className="h-64 rounded-md border p-2">
                    <div className="space-y-1 pr-2">
                      {mdFiles.map(file => (
                        <div key={file.name} className="flex items-center justify-between rounded-md p-2 hover:bg-secondary">
                          <div className="flex items-center gap-2 truncate">
                            {file.icon}
                            <span className="text-sm truncate">{file.name}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(file.content!, file.name)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Media Files ({media.length})</h3>
                   <ScrollArea className="h-64 rounded-md border p-2">
                    <div className="space-y-1 pr-2">
                      {media.map(file => (
                        <div key={file.name} className="flex items-center gap-2 p-2">
                          {file.icon}
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              <Separator className="my-6" />
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-semibold">Important Next Step</AlertTitle>
                <AlertDescription>
                  For media links to work in Obsidian, move your original media files into the same folder as your new Markdown files.
                </AlertDescription>
              </Alert>
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                 <Button size="lg" className="w-full sm:w-auto flex-grow" onClick={handleDownloadAll}>
                    <Download className="mr-2 h-5 w-5" /> Download All Markdown Files
                  </Button>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={handleReset}>
                    <RefreshCcw className="mr-2 h-5 w-5" /> Convert Another
                  </Button>
              </div>
            </CardContent>
          </>
        );
       case 'error':
        return (
            <CardContent className="flex flex-col items-center text-center p-8">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h2 className="mt-4 font-headline text-2xl text-destructive">Conversion Failed</h2>
                <p className="mt-2 text-muted-foreground">{error}</p>
                <Button size="lg" className="mt-6" onClick={handleReset}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
                </Button>
            </CardContent>
        );
      case 'idle':
      default:
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className="font-headline text-2xl">Start Your Conversion</CardTitle>
              <CardDescription>
                Select your 'Google Keep' folder from your Google Takeout export.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                webkitdirectory=""
                directory=""
                multiple
              />
              <Button size="lg" onClick={triggerFileSelect}>
                <Upload className="mr-2 h-5 w-5" /> Upload Folder
              </Button>
              <p className="mt-4 text-xs text-muted-foreground">All processing happens in your browser. Your files are never uploaded.</p>
            </CardContent>
          </>
        );
    }
  };

  return (
    <Card className="w-full max-w-4xl shadow-lg animate-in fade-in-50 duration-500">
      {renderContent()}
    </Card>
  );
}
