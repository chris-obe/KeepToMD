

"use client";

import { useState, useRef, type ChangeEvent, useEffect } from 'react';
import {
  Upload,
  Folder,
  Cog,
  FileText,
  Eye,
  Settings,
  Info,
  Minus,
  Plus,
  Download,
  Loader2,
  ShieldCheck,
  ChevronRight,
  FileArchive,
  Smile,
  Save,
  Trash2,
  History,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Label } from '@/components/ui/label';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import type { ConvertToMarkdownOutput, FormattingOptions, NamingOptions } from '@/ai/schemas';
import * as cheerio from 'cheerio';
import { format } from 'date-fns';
import TurndownService from 'turndown';
import JSZip from 'jszip';
import { Input } from '../ui/input';
import CryptoJS from 'crypto-js';
import { usePresets } from '@/hooks/use-presets';


const turndownService = new TurndownService();

// --- Conversion Logic Moved from Server to Client ---

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
function formatMarkdown(data: ReturnType<typeof parseKeepHtml>, formattingOptions: FormattingOptions) {
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
function createFilename(data: ReturnType<typeof parseKeepHtml>, options: NamingOptions, serial: number): string {
  const parts: string[] = [];
  const now = new Date();
  
  const emojiPart = options.useEmoji ? options.selectedEmoji : '';

  const datePart = options.useDate ? format(data.creationTime, options.dateFormat) : '';
  const timePart = options.useTime ? format(now, options.timeFormat) : '';
  let dateTimePart = [datePart, timePart].filter(Boolean).join('_');
  
  if (dateTimePart) {
      if (options.datePosition === 'prepend') {
          if (options.useEmoji && options.emojiPosition === 'beforeDate') {
              dateTimePart = `${emojiPart} ${dateTimePart}`;
          }
          if (options.useEmoji && options.emojiPosition === 'afterDate') {
              dateTimePart = `${dateTimePart} ${emojiPart}`;
          }
          parts.unshift(dateTimePart);
      }
  }

  let titlePart = '';
  if (options.useTitle && data.title) {
    titlePart = data.title;
  } else if (options.useBody) {
    const cleanContent = data.content.replace(/\s+/g, ' ').trim();
    let snippet = '';
    if (options.bodyUnit === 'characters') {
      snippet = cleanContent.substring(0, options.bodyLength);
    } else if (options.bodyUnit === 'words') {
      snippet = cleanContent.split(/\s+/).slice(0, options.bodyLength).join(' ');
    } else { // lines
      snippet = data.content.split('\n').slice(0, options.bodyLength).join(' ').replace(/\s+/g, ' ').trim();
    }
    titlePart = snippet;
  }
  
  if (!titlePart) {
      titlePart = 'Untitled';
  }

  titlePart = titlePart.replace(/[\\/]/g, '-'); // Sanitize

  if (options.useEmoji && options.emojiPosition === 'afterTitle') {
      titlePart = `${titlePart} ${emojiPart}`;
  }
  parts.push(titlePart);

  if (dateTimePart && options.datePosition === 'append') {
      if (options.useEmoji && options.emojiPosition === 'beforeDate') {
          dateTimePart = `${emojiPart} ${dateTimePart}`;
      }
      if (options.useEmoji && options.emojiPosition === 'afterDate') {
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

// --- End of Moved Conversion Logic ---



export type RunHistoryItem = {
  id: string;
  date: string;
  hash: string;
  fileCount: number;
  fileIdentifiers: string[];
};

const getFileIdentifier = (file: File) => `${file.name}_${file.lastModified}`;

const generateHash = (files: File[]) => {
  const fileDetails = files.map(getFileIdentifier).sort().join('|');
  return CryptoJS.SHA256(fileDetails).toString();
};


const InfoTooltip = ({ children }: { children: React.ReactNode }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="ml-1 text-muted-foreground">
          <Info className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs">{children}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export function FileProcessingArea() {
  const [allFiles, setAllFiles] = useState<File[]>([]);
  const [htmlFiles, setHtmlFiles] = useState<File[]>([]);
  const [assetFiles, setAssetFiles] = useState<File[]>([]);
  const [firstNoteTitle, setFirstNoteTitle] = useState<string>('My Note Title');
  const [filenamePreview, setFilenamePreview] = useState<string>('');
  const [presetNameToSave, setPresetNameToSave] = useState('');

  const {
    presets,
    namingOptions,
    setNamingOptions,
    formattingOptions,
    setFormattingOptions,
    selectedPreset,
    handleSelectPreset,
    handleSavePreset,
    handleDeletePreset
  } = usePresets();

  const [convertedFiles, setConvertedFiles] = useState<ConvertToMarkdownOutput['convertedFiles']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [queuedFiles, setQueuedFiles] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<typeof convertedFiles[0] | null>(null);

  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);
  const [duplicateRun, setDuplicateRun] = useState<RunHistoryItem | null>(null);
  const [isDuplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- History Management ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedHistory = localStorage.getItem('keepSyncHistory');
        if (savedHistory) {
          setRunHistory(JSON.parse(savedHistory));
        }
      } catch (error) {
        console.error("Failed to load history from localStorage", error);
      }
    }
  }, []);

  const addToHistory = (newRun: Omit<RunHistoryItem, 'id' | 'date'>) => {
    const runToAdd: RunHistoryItem = {
      ...newRun,
      id: new Date().toISOString(),
      date: new Date().toISOString(),
    };
    const updatedHistory = [runToAdd, ...runHistory];
    setRunHistory(updatedHistory);
    localStorage.setItem('keepSyncHistory', JSON.stringify(updatedHistory));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        const ignoredFiles = ['.DS_Store', 'Thumbs.db'];
        const selectedFiles = Array.from(event.target.files).filter(
            file => !ignoredFiles.includes(file.name)
        );
        
        setAllFiles(selectedFiles);
        const htmls = selectedFiles.filter(file => file.type === 'text/html');
        setHtmlFiles(htmls);
        setAssetFiles(selectedFiles.filter(file => file.type !== 'text/html'));
        setConvertedFiles([]); // Reset on new file selection
        setProgress(0);
        
        if (htmls.length > 0) {
          const currentHash = generateHash(htmls);
          const foundDuplicate = runHistory.find(run => run.hash === currentHash);
          if (foundDuplicate) {
              setDuplicateRun(foundDuplicate);
              setDuplicateDialogOpen(true);
          } else {
              setDuplicateRun(null);
          }
        }
    }
  };

  useEffect(() => {
    if (htmlFiles.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (!content) return;
            const $ = cheerio.load(content);
            const title = $('.title').text().trim();
            if (title) {
                setFirstNoteTitle(title);
            } else {
                setFirstNoteTitle('Untitled Note');
            }
        };
        reader.readAsText(htmlFiles[0]);
    } else {
        setFirstNoteTitle('My Note Title');
    }
  }, [htmlFiles]);
  
  const startConversion = (files: File[], isPreview: boolean) => {
    if(isPreview) {
      handleRunConversion(files, true);
    } else {
      handleRunConversion(files, false);
    }
  }

  const handleDuplicateDialogAction = (action: 'new' | 'all') => {
    setDuplicateDialogOpen(false);
    if (action === 'all') {
      startConversion(htmlFiles, false);
    } else if (action === 'new') {
      const processedFileIdentifiers = new Set(
        runHistory.flatMap(run => run.fileIdentifiers)
      );
      const newFiles = htmlFiles.filter(file => !processedFileIdentifiers.has(getFileIdentifier(file)));
      
      if(newFiles.length === 0) {
        toast({
          title: "No New Files",
          description: "All notes in this selection have been converted in previous runs.",
        });
        return;
      }
      toast({
        title: "Converting New Files",
        description: `Skipping ${htmlFiles.length - newFiles.length} previously converted notes.`,
      });
      startConversion(newFiles, false);
    }
  };


  const handleRunConversion = async (filesToProcess: File[], preview = false) => {
    if (filesToProcess.length === 0) {
      toast({
        variant: "destructive",
        title: "No HTML files selected",
        description: "Please select your Google Keep HTML files first.",
      });
      return;
    }
  
    setIsLoading(true);
    setProgress(0);
    if (!preview) {
      setConvertedFiles([]);
    }
  
    try {
      // If date sorting is enabled, we need to read all dates first.
      if (namingOptions.useDate) {
        setStatusText('Sorting files by date...');
        const filesWithDates = await Promise.all(
            filesToProcess.map(async file => {
              const content = await file.text();
              const data = parseKeepHtml(content);
              return { file, date: data.creationTime };
            })
          );
          filesWithDates.sort((a, b) => a.date.getTime() - b.date.getTime());
          filesToProcess = filesWithDates.map(f => f.file);
      }
      
      const fileQueue = filesToProcess.map(f => f.name);
      setQueuedFiles(fileQueue);
  
      setStatusText(`Starting conversion of ${fileQueue.length} notes...`);
  
      const totalFiles = filesToProcess.length;
      const newlyConvertedFiles: ConvertToMarkdownOutput['convertedFiles'] = [];
      
      for (let i = 0; i < totalFiles; i++) {
        const file = filesToProcess[i];
        
        if (!preview) {
            const remainingQueue = fileQueue.slice(i + 1);
            setQueuedFiles(remainingQueue);
            setStatusText(`Converting: ${file.name}`);
        }
  
        // Read file content one by one inside the loop
        const fileContent = await file.text();
        const data = parseKeepHtml(fileContent);
        
        const markdownContent = formatMarkdown(data, formattingOptions);
        const newFilename = createFilename(data, namingOptions, i + 1);
  
        newlyConvertedFiles.push({
          originalPath: file.name,
          newPath: newFilename,
          content: markdownContent,
        });
  
        if (!preview) {
            await new Promise(resolve => setTimeout(resolve, 5)); // Small delay for UI update
            setProgress(((i + 1) / totalFiles) * 100);
        }
      }
      
      const result = { convertedFiles: newlyConvertedFiles };
  
      if (result && result.convertedFiles) {
        if (preview) {
           setConvertedFiles(result.convertedFiles);
           setStatusText('Preview ready.');
           setProgress(100);
           toast({
              title: "Preview Generated",
              description: `Showing preview for the first of ${totalFiles} files.`,
          });
        } else {
          setConvertedFiles(result.convertedFiles);
          setStatusText('Conversion complete! Preparing download...');
          await downloadAllAsZip(result.convertedFiles);
          
          const currentHash = generateHash(filesToProcess);
          const fileIdentifiers = filesToProcess.map(getFileIdentifier);
          addToHistory({ hash: currentHash, fileCount: filesToProcess.length, fileIdentifiers });

          toast({
              title: "Conversion Successful",
              description: `${totalFiles} notes and ${assetFiles.length} assets have been prepared for download.`,
          });
        }
        
        if (preview && result.convertedFiles.length > 0) {
            setPreviewFile(result.convertedFiles[0]);
            setTimeout(() => document.getElementById('preview-dialog-trigger')?.click(), 0);
        }
      } else {
        throw new Error("Conversion resulted in an unexpected format.");
      }
    } catch (error) {
      console.error("Conversion failed:", error);
      setStatusText('Conversion failed.');
      setProgress(0);
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
        setTimeout(() => {
          setIsLoading(false);
          setStatusText('');
          setQueuedFiles([]);
        }, 3000);
    }
  };
  
  const downloadFile = (file: { newPath: string, content: BlobPart }) => {
    const blob = new Blob([file.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.newPath;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const downloadAllAsZip = async (filesToDownload = convertedFiles) => {
    setStatusText('Creating .zip file...');
    const zip = new JSZip();

    // Add markdown files
    filesToDownload.forEach(file => {
        zip.file(file.newPath, file.content);
    });

    // Add asset files
    assetFiles.forEach(file => {
        zip.file(file.name, file);
    });
    
    const zipBlob = await zip.generateAsync({type:"blob"}, (metadata) => {
        setProgress(metadata.percent);
        setStatusText(`Compressing files... ${Math.round(metadata.percent)}%`);
    });

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'KeepSync-Export.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusText('Download started!');
  }


  useEffect(() => {
    if (typeof window === 'undefined') return;

    const getFilenamePreview = () => {
      if (!htmlFiles.length) {
        setFilenamePreview('');
        return;
      }

      const parts: string[] = [];
      const now = new Date();
      const emojiPart = namingOptions.useEmoji ? namingOptions.selectedEmoji : '';

      const datePart = namingOptions.useDate ? format(now, namingOptions.dateFormat) : '';
      const timePart = namingOptions.useTime ? format(now, namingOptions.timeFormat) : '';
      let dateTimePart = [datePart, timePart].filter(Boolean).join('_');
  
      if (dateTimePart && namingOptions.datePosition === 'prepend') {
          if (namingOptions.useEmoji && namingOptions.emojiPosition === 'beforeDate') {
            dateTimePart = `${emojiPart} ${dateTimePart}`;
          }
           if (namingOptions.useEmoji && namingOptions.emojiPosition === 'afterDate') {
            dateTimePart = `${dateTimePart} ${emojiPart}`;
          }
          parts.push(dateTimePart);
      }
  
      let titlePart = firstNoteTitle;
      if (!namingOptions.useTitle && namingOptions.useBody) { // Simplified for preview
          const bodyContent = "This is the beginning of the note content and it can be quite long.";
          let bodySnippet = "";
          switch (namingOptions.bodyUnit) {
              case 'characters':
                  bodySnippet = bodyContent.substring(0, namingOptions.bodyLength);
                  break;
              case 'words':
                  bodySnippet = bodyContent.split(/\s+/).slice(0, namingOptions.bodyLength).join(' ');
                  break;
              case 'lines':
                  bodySnippet = bodyContent.split('\n').slice(0, namingOptions.bodyLength).join(' ');
                  break;
          }
          titlePart = bodySnippet || "Untitled";
      } else if (namingOptions.useTitle) {
        // Show title
      } else if (namingOptions.useBody) {
        titlePart = `${firstNoteTitle} (or first ${namingOptions.bodyLength} ${namingOptions.bodyUnit} of body)`;
      } else {
          titlePart = "Untitled";
      }

      if (namingOptions.useEmoji && namingOptions.emojiPosition === 'afterTitle') {
        titlePart = `${titlePart} ${emojiPart}`;
      }
      
      if (titlePart) parts.push(titlePart);
      
      if (dateTimePart && namingOptions.datePosition === 'append') {
          if (namingOptions.useEmoji && namingOptions.emojiPosition === 'beforeDate') {
            dateTimePart = `${emojiPart} ${emojiPart}`;
          }
           if (namingOptions.useEmoji && namingOptions.emojiPosition === 'afterDate') {
            dateTimePart = `${dateTimePart} ${emojiPart}`;
          }
          parts.push(dateTimePart);
      }
      
      if (namingOptions.useSerial && namingOptions.useDate) {
          let serial = '1';
          if (namingOptions.serialPadding === '01') serial = '01';
          if (namingOptions.serialPadding === '001') serial = '001';
          if (namingOptions.serialPadding === '0001') serial = '0001';
          parts.push(serial);
      }
  
      let preview = parts.join(' - ').replace(/\s+/g, ' ').trim();
      if (!preview) {
          preview = "Untitled"
      }
  
      setFilenamePreview(preview + '.md');
    }
    getFilenamePreview();
  }, [namingOptions, firstNoteTitle, htmlFiles]);


  const handlePreviewClick = async () => {
    await handleRunConversion(htmlFiles, true);
  }

  // A simple function to convert markdown-style image links to HTML img tags
  const renderMarkdownContent = (content: string) => {
    // This is a very basic renderer. For a full-featured preview,
    // a library like 'react-markdown' would be ideal.
    return content.split('\n').map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-3 mb-1.5">{line.substring(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-2 mb-1">{line.substring(4)}</h3>;
        if (line.startsWith('**Tags:**')) return <p key={i} className="my-2">{line}</p>;
        if (line.startsWith('**Created:**')) return <p key={i} className="text-sm text-muted-foreground mb-4">{line}</p>;
        if (line.match(/!\[\[(.*?)\]\]/)) {
          const imageName = line.match(/!\[\[(.*?)\]\]/)?.[1];
          const imageFile = assetFiles.find(f => f.name === imageName);
          if (imageFile) {
            return <img key={i} src={URL.createObjectURL(imageFile)} alt={imageName} className="max-w-full rounded-lg my-4"/>
          }
          return <p key={i} className="my-2 text-muted-foreground italic">![[Image: {imageName}]] (preview unavailable)</p>;
        }
        if (line.trim() === '') return <br key={i} />;
        return <p key={i}>{line}</p>;
    });
  }
  
  const handleBodyUnitChange = (value: 'characters' | 'words' | 'lines') => {
    let newLength = namingOptions.bodyLength;
    if (value === 'characters') newLength = 30;
    if (value === 'words') newLength = 5;
    if (value === 'lines') newLength = 1;
    setNamingOptions(p => ({...p, bodyUnit: value, bodyLength: newLength}));
  }

  const onSavePreset = () => {
    if (!presetNameToSave) {
      toast({ variant: 'destructive', title: 'Preset name cannot be empty.' });
      return;
    }
    handleSavePreset(presetNameToSave);
    toast({ title: 'Preset Saved', description: `Preset "${presetNameToSave}" has been saved.` });
    setPresetNameToSave('');
  };

  return (
    <div className="w-full max-w-4xl animate-in fade-in-50 duration-500">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept=".html,.jpg,.jpeg,.png,.gif,.mp3,.wav,.ogg,.m4a"
        webkitdirectory=""
      />
       <AlertDialog open={isDuplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-primary h-6 w-6" />
              Duplicate Run Detected
            </AlertDialogTitle>
            <AlertDialogDescription>
              It looks like you've processed this exact set of files before on{' '}
              {duplicateRun ? format(new Date(duplicateRun.date), 'PPpp') : 'a previous date'}.
              How would you like to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end gap-2">
            <Button variant="secondary" onClick={() => handleDuplicateDialogAction('all')}>
                Convert All Again
            </Button>
            <Button variant="outline" onClick={() => handleDuplicateDialogAction('new')}>
              Convert New Files Only
            </Button>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full space-y-4">
        {/* Import Section */}
        <AccordionItem value="item-1" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-6 py-4 text-lg font-semibold bg-primary/10 hover:no-underline [&[data-state=open]>svg]:-rotate-180">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <span>Import</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-4 pb-6">
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start h-12 text-base"
                onClick={() => fileInputRef.current?.click()}
                >
                <Folder className="mr-2 h-5 w-5" />
                {allFiles.length > 0 ? `${allFiles.length} file(s) selected` : 'Select Google Takeout Folder'}
              </Button>
              {allFiles.length > 0 && (
                <div className="text-sm text-muted-foreground">
                    <p>{htmlFiles.length} HTML notes found.</p>
                    <p>{assetFiles.length} other assets (images, audio, etc.) found.</p>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-lg bg-background/50 p-3 text-sm text-muted-foreground">
                <ShieldCheck className="h-5 w-5 shrink-0 text-accent" />
                <p>Your files are processed locally in your browser and never leave your device.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Process Section */}
        <AccordionItem value="item-2" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-6 py-4 text-lg font-semibold bg-accent/10 hover:no-underline [&[data-state=open]>svg]:-rotate-180">
             <div className="flex items-center gap-2">
                <Cog className="h-5 w-5 text-accent" />
                <span>Process</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-4 pb-6 space-y-6">
            <div className="space-y-2">
              <Label>Load Preset</Label>
              <div className="flex gap-2">
                <Select onValueChange={handleSelectPreset} value={selectedPreset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a preset..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Settings</SelectItem>
                    <Separator className="my-1" />
                    {presets.map(p => (
                      <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPreset && selectedPreset !== 'default' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="destructive" size="icon" onClick={() => handleDeletePreset(selectedPreset)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete '{selectedPreset}' preset</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            <Card className="bg-background/50">
                <CardHeader>
                    <CardTitle className="flex items-center text-base">
                        File Naming Convention
                        <div className="flex-grow" />
                        <InfoTooltip>Configure how your output files will be named.</InfoTooltip>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="title" checked={namingOptions.useTitle} onCheckedChange={(checked) => setNamingOptions(prev => ({ ...prev, useTitle: !!checked }))} />
                            <Label htmlFor="title">Use note title</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="body" checked={namingOptions.useBody} onCheckedChange={(checked) => setNamingOptions(prev => ({ ...prev, useBody: !!checked }))} />
                            <Label htmlFor="body" className="flex items-center">
                              Use note body if no title
                              <InfoTooltip>Use the first part of the body as a fallback if the note has no title.</InfoTooltip>
                            </Label>
                        </div>
                    </div>

                    {namingOptions.useBody && (
                    <div className="space-y-4 pt-4 border-t border-border pl-6">
                        <Label className="font-semibold">Title from body options</Label>
                         <div className="flex items-center space-x-2">
                           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setNamingOptions(p => ({ ...p, bodyLength: Math.max(1, p.bodyLength - 1) }))}><Minus className="h-4 w-4"/></Button>
                           <span className="w-8 text-center text-sm">{namingOptions.bodyLength}</span>
                           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setNamingOptions(p => ({ ...p, bodyLength: p.bodyLength + 1 }))}><Plus className="h-4 w-4"/></Button>
                        </div>
                        <RadioGroup value={namingOptions.bodyUnit} onValueChange={handleBodyUnitChange} className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="characters" id="characters" />
                                <Label htmlFor="characters">characters</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="words" id="words" />
                                <Label htmlFor="words">words</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="lines" id="lines" />
                                <Label htmlFor="lines">lines</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    )}
                    
                    <Separator />

                     <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="date" checked={namingOptions.useDate} onCheckedChange={(checked) => setNamingOptions(prev => ({ ...prev, useDate: !!checked, useSerial: checked ? prev.useSerial : false }))} />
                            <Label htmlFor="date">Add date</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="time" checked={namingOptions.useTime} onCheckedChange={(checked) => setNamingOptions(prev => ({ ...prev, useTime: !!checked }))}/>
                            <Label htmlFor="time">Add time</Label>
                        </div>
                    </div>
                    
                    {(namingOptions.useDate || namingOptions.useTime) && (
                    <div className="space-y-4 pt-4 border-t border-border pl-6">
                        {namingOptions.useDate && (
                            <div className="space-y-2">
                                <Label className="font-semibold">Date format</Label>
                                <RadioGroup value={namingOptions.dateFormat} onValueChange={(value) => setNamingOptions(p => ({...p, dateFormat: value}))} className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="yyyy-MM-dd" id="df-1" />
                                        <Label htmlFor="df-1">2024-07-29</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="dd-MM-yyyy" id="df-2" />
                                        <Label htmlFor="df-2">29-07-2024</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="MM-dd-yyyy" id="df-3" />
                                        <Label htmlFor="df-3">07-29-2024</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="yyyyMMdd" id="df-4" />
                                        <Label htmlFor="df-4">20240729</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}
                        {namingOptions.useTime && (
                           <div className="space-y-2">
                                <Label className="font-semibold">Time format</Label>
                                <Select value={namingOptions.timeFormat} onValueChange={(value) => setNamingOptions(p => ({...p, timeFormat: value}))}>
                                   <SelectTrigger className="w-[180px] h-8 text-sm">
                                       <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                       <SelectItem value="HH-mm-ss">14-30-55</SelectItem>
                                       <SelectItem value="hh-mm-ss a">02-30-55 PM</SelectItem>
                                       <SelectItem value="HHmmss">143055</SelectItem>
                                   </SelectContent>
                               </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label className="font-semibold">Date position</Label>
                            <RadioGroup value={namingOptions.datePosition} onValueChange={(value: 'prepend' | 'append') => setNamingOptions(prev => ({ ...prev, datePosition: value }))} className="flex mt-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="prepend" id="prepend" />
                                    <Label htmlFor="prepend">Prepend</Label>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                    <RadioGroupItem value="append" id="append" />
                                    <Label htmlFor="append">Append</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                    )}


                    <Separator />
                    
                    {namingOptions.useDate && (
                    <>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="serial" checked={namingOptions.useSerial} onCheckedChange={(checked) => setNamingOptions(prev => ({ ...prev, useSerial: !!checked }))} />
                            <Label htmlFor="serial">Add serial number</Label>
                        </div>
                    </div>
                    {namingOptions.useSerial && (
                    <div className="space-y-2 pt-4 border-t border-border pl-6">
                        <Label className="font-semibold flex items-center">Serial number padding <InfoTooltip>Choose the padding for your serial numbers. Sorting by date is recommended for predictable numbering.</InfoTooltip></Label>
                        <RadioGroup value={namingOptions.serialPadding} onValueChange={(value) => setNamingOptions(prev => ({ ...prev, serialPadding: value as '1' | '01' | '001' | '0001' }))} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="1" id="s1" />
                                <Label htmlFor="s1">1, 2, 3</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="01" id="s01" />
                                <Label htmlFor="s01">01, 02, 03</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="001" id="s001" />
                                <Label htmlFor="s001">001, 002, 003</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="0001" id="s0001" />
                                <Label htmlFor="s0001">0001, 0002, 0003</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    )}
                    <Separator />
                    </>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="emoji" checked={namingOptions.useEmoji} onCheckedChange={(checked) => setNamingOptions(prev => ({ ...prev, useEmoji: !!checked }))} />
                            <Label htmlFor="emoji">Add emoji</Label>
                        </div>
                    </div>

                    {namingOptions.useEmoji && (
                        <div className="space-y-4 pt-4 border-t border-border pl-6">
                            <div className="space-y-2">
                                <Label className="font-semibold">Emoji</Label>
                                <RadioGroup value={namingOptions.selectedEmoji} onValueChange={(value) => setNamingOptions(p => ({...p, selectedEmoji: value}))} className="grid grid-cols-3 gap-2 mt-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="🟡" id="e-1" />
                                        <Label htmlFor="e-1">🟡</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="💡" id="e-2" />
                                        <Label htmlFor="e-2">💡</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="✨" id="e-3" />
                                        <Label htmlFor="e-3">✨</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Emoji position</Label>
                                <RadioGroup 
                                    value={namingOptions.emojiPosition} 
                                    onValueChange={(value: 'beforeDate' | 'afterDate' | 'afterTitle') => setNamingOptions(prev => ({ ...prev, emojiPosition: value }))} 
                                    className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="beforeDate" id="ep-1" />
                                        <Label htmlFor="ep-1">Before date</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="afterDate" id="ep-2" />
                                        <Label htmlFor="ep-2">After date</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="afterTitle" id="ep-3" />
                                        <Label htmlFor="ep-3">After title</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    )}

                    <Separator />


                    <div className="bg-secondary p-3 rounded-md text-sm text-muted-foreground flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary shrink-0"/>
                        {filenamePreview ? <span className="truncate">{filenamePreview}</span> : <span className="text-muted-foreground/80">Preview will appear here...</span>}
                    </div>

                </CardContent>
            </Card>

            <Card className="bg-background/50">
                 <CardHeader>
                    <CardTitle className="flex items-center text-base">
                        <FileText className="mr-2 h-5 w-5 text-purple-400" />
                        Markdown Formatting
                        <div className="flex-grow" />
                        <InfoTooltip>Options for how content is formatted inside the markdown files.</InfoTooltip>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                     <div>
                        <Label className="font-semibold flex items-center">Tag handling <span className="ml-2 text-sm font-normal text-muted-foreground">relevant for Obsidian Graphs</span><InfoTooltip>Choose how to represent Google Keep tags in Obsidian.</InfoTooltip></Label>
                        <RadioGroup value={formattingOptions.tagHandling} onValueChange={(value) => setFormattingOptions(prev => ({...prev, tagHandling: value as 'links' | 'hash' | 'atlinks'}))} className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="links" id="links" />
                                <Label htmlFor="links">Links (notes)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="hash" id="hash" />
                                <Label htmlFor="hash">#Hashtags</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="atlinks" id="atlinks" />
                                <Label htmlFor="atlinks">@Mentions</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="preset-name-save">Save Current Settings as Preset</Label>
                      <div className="flex gap-2">
                        <Input
                          id="preset-name-save"
                          placeholder="My Awesome Preset"
                          value={presetNameToSave}
                          onChange={(e) => setPresetNameToSave(e.target.value)}
                        />
                        <Button onClick={onSavePreset}><Save className="mr-2 h-4 w-4" /> Save</Button>
                      </div>
                    </div>
                    <Separator />
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button id="preview-dialog-trigger" className="w-full" onClick={handlePreviewClick} disabled={isLoading || htmlFiles.length === 0}>
                                {isLoading && convertedFiles.length === 0 ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Eye className="mr-2 h-5 w-5" />}
                                {isLoading && convertedFiles.length === 0 ? 'Processing...' : 'Preview Markdown'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Conversion Preview</DialogTitle>
                            </DialogHeader>
                            <div className="flex-grow grid grid-cols-3 gap-4 overflow-hidden">
                                <ScrollArea className="col-span-1 border rounded-lg">
                                    <div className="p-4">
                                    {convertedFiles.map((file, index) => (
                                        <div key={index}>
                                            <button onClick={() => setPreviewFile(file)} className={`w-full text-left p-2 rounded-md ${previewFile?.originalPath === file.originalPath ? 'bg-accent' : ''}`}>
                                                <p className="font-semibold truncate">{file.newPath}</p>
                                                <p className="text-xs text-muted-foreground truncate">{file.originalPath}</p>
                                            </button>
                                        </div>
                                    ))}
                                    </div>
                                </ScrollArea>
                                <ScrollArea className="col-span-2 border rounded-lg">
                                    {previewFile ? (
                                        <div className="p-4">
                                            <div className="prose dark:prose-invert max-w-none prose-p:my-2 prose-h1:mb-4 prose-h1:mt-2 prose-h2:mb-3 prose-h2:mt-1.5 prose-h3:mb-2 prose-h3:mt-1 font-body text-foreground">
                                              {renderMarkdownContent(previewFile.content)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            <p>Select a file to preview</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                {previewFile && <Button variant="outline" onClick={() => downloadFile({newPath: previewFile.newPath, content: previewFile.content})}>Download Selected</Button>}
                                <Button onClick={() => downloadAllAsZip(convertedFiles)}>Download All Previewed as .zip</Button>
                            </div>
                        </DialogContent>
                     </Dialog>

                </CardContent>
            </Card>

          </AccordionContent>
        </AccordionItem>

        {/* Finish Section */}
        <AccordionItem value="item-3" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-6 py-4 text-lg font-semibold bg-purple-500/10 hover:no-underline [&[data-state=open]>svg]:-rotate-180">
             <div className="flex items-center gap-2">
                <FileArchive className="h-5 w-5 text-purple-400" />
                <span>Finish</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-4 pb-6">
             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto" onClick={() => startConversion(htmlFiles, false)} disabled={isLoading || htmlFiles.length === 0}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                    {isLoading ? 'Processing...' : 'Convert & Download .zip'}
                </Button>
            </div>
             {isLoading && (
              <div className="mt-6 w-full space-y-4 rounded-lg bg-secondary/50 p-4">
                  <div className="space-y-2 text-center">
                    <p className="text-sm font-medium text-muted-foreground truncate">{statusText}</p>
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-muted-foreground">{htmlFiles.length - queuedFiles.length}/{htmlFiles.length} files converted ({Math.round(progress)}%)</p>
                  </div>
                  {queuedFiles.length > 0 && (
                      <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Up next...</p>
                          <ScrollArea className="h-24 w-full rounded-md border bg-background/50">
                              <div className="p-2 text-xs text-muted-foreground">
                                  {queuedFiles.slice(0, 10).map((file, i) => (
                                      <p key={i} className="truncate flex items-center">
                                          <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0" />
                                          {file}
                                      </p>
                                  ))}
                                  {queuedFiles.length > 10 && <p className="mt-1">...and {queuedFiles.length - 10} more</p>}
                              </div>
                          </ScrollArea>
                      </div>
                  )}
              </div>
            )}
            {allFiles.length > 0 && !isLoading && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-background/50 p-3 text-sm text-muted-foreground">
                    <Info className="h-5 w-5 shrink-0 text-accent" />
                    <div className="space-y-1">
                        <p>This will download a single .zip file containing {htmlFiles.length} converted notes and {assetFiles.length} assets.</p>
                        <p>For best results in Obsidian, unzip the file and place your assets in the same folder as your notes.</p>
                    </div>
                </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

    