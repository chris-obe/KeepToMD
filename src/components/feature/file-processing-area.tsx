

"use client";

import { useState, useRef, type ChangeEvent, useEffect, useMemo } from 'react';
import {
  Upload,
  Folder,
  Cog,
  FileText,
  Eye,
  Info,
  Minus,
  Plus,
  Download,
  Loader2,
  ShieldCheck,
  ChevronRight,
  FileArchive,
  Save,
  Trash2,
  AlertTriangle,
  CalendarDays,
  Clock,
  Pencil,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
import type { ConvertToMarkdownOutput } from '@/ai/schemas';
import { format } from 'date-fns';
import JSZip from 'jszip';
import { Input } from '../ui/input';
import CryptoJS from 'crypto-js';
import { usePresets } from '@/hooks/use-presets';
import {
  buildFilename,
  buildFilenamePreview,
  formatMarkdown,
  parseKeepHtml,
  type ParsedKeepNote,
} from '@/lib/keep-convert';
import { STORAGE_KEYS } from '@/lib/storage-keys';





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
  <TooltipProvider delayDuration={500}>
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
  const [isLivePreviewOpen, setLivePreviewOpen] = useState(false);
  const [previewNote, setPreviewNote] = useState<ParsedKeepNote | null>(null);
  const [isPreviewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const {
    namingPresets,
    handleSelectNamingPreset,
    handleSaveNamingPreset,
    handleDeleteNamingPreset,
    selectedNamingPreset,
    namingOptions,
    setNamingOptions,
    markdownPresets,
    handleSelectMarkdownPreset,
    selectedMarkdownPreset,
    formattingOptions,
    setFormattingOptions,
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
  
  const isFillerTextActive = !namingOptions.useTitle || !namingOptions.useBody;

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOpenFilePicker = () => {
      fileInputRef.current?.click();
    };

    window.addEventListener('keep-sync-open-file-picker', handleOpenFilePicker);
    return () => {
      window.removeEventListener('keep-sync-open-file-picker', handleOpenFilePicker);
    };
  }, []);

  // --- History Management ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedHistory = localStorage.getItem(STORAGE_KEYS.history);
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
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(updatedHistory));
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
        setLivePreviewOpen(htmls.length > 0);
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
            const data = parseKeepHtml(content);
            if (data.title) {
              setFirstNoteTitle(data.title);
            } else {
              setFirstNoteTitle('Untitled Note');
            }
        };
        reader.readAsText(htmlFiles[0]);
    } else {
        setFirstNoteTitle('My Note Title');
    }
  }, [htmlFiles]);

  useEffect(() => {
    if (htmlFiles.length === 0) {
      setPreviewNote(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    let isActive = true;
    setPreviewLoading(true);
    setPreviewError(null);

    htmlFiles[0]
      .text()
      .then((content) => {
        if (!isActive) return;
        setPreviewNote(parseKeepHtml(content));
      })
      .catch((error) => {
        if (!isActive) return;
        setPreviewNote(null);
        setPreviewError(error instanceof Error ? error.message : 'Unable to load preview.');
      })
      .finally(() => {
        if (!isActive) return;
        setPreviewLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [htmlFiles]);

  // Motion effects intentionally disabled for now.

  const previewMarkdown = useMemo(() => {
    if (!previewNote) return '';
    return formatMarkdown(previewNote, formattingOptions);
  }, [previewNote, formattingOptions]);
  
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
        const newFilename = buildFilename({ note: data, options: namingOptions, serial: i + 1 });
  
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
    a.download = 'KeepToMD-Export.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusText('Download started!');
  }


  useEffect(() => {
    if (typeof window === 'undefined') return;
  
    const getFilenamePreview = () => {
      const preview = buildFilenamePreview({
        options: namingOptions,
        firstNoteTitle,
        bodyPreview: 'This is the beginning of the note content and it can be quite long.',
      });
      setFilenamePreview(preview);
    };
  
    getFilenamePreview();
  }, [namingOptions, firstNoteTitle]);


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
    handleSaveNamingPreset(presetNameToSave);
    toast({ title: 'Preset Saved', description: `Preset "${presetNameToSave}" has been saved.` });
    setPresetNameToSave('');
  };

  const renderMarkdownPresetSelect = (
    label: string,
    triggerClassName?: string,
    placeholder = 'Select a preset...',
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select onValueChange={handleSelectMarkdownPreset} value={selectedMarkdownPreset}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default Settings</SelectItem>
          <Separator className="my-1" />
          {markdownPresets.map(p => (
            <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const livePreviewPanel = (
    <div className="rounded-lg border bg-card/70 min-[769px]:sticky min-[769px]:top-20 min-[769px]:flex min-[769px]:h-[calc(100svh-6rem)] min-[769px]:flex-col">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Live Preview</p>
          <p className="text-xs text-muted-foreground">
            {htmlFiles.length > 0 ? `First note: ${htmlFiles[0].name}` : 'Select a takeout folder to preview.'}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setLivePreviewOpen(false)}
          aria-label="Hide live preview"
          title="Hide live preview"
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3 px-4 pt-3">
        {renderMarkdownPresetSelect('Markdown Preset')}
        <p className="text-xs text-muted-foreground">
          Output name: <span className="font-medium text-foreground">{filenamePreview}</span>
        </p>
      </div>
      <div className="p-4 pt-3 min-[769px]:flex-1 min-[769px]:min-h-0">
        <ScrollArea className="h-[320px] min-[769px]:h-full">
          {isPreviewLoading && (
            <p className="text-sm text-muted-foreground">Loading preview...</p>
          )}
          {!isPreviewLoading && previewError && (
            <p className="text-sm text-destructive">{previewError}</p>
          )}
          {!isPreviewLoading && !previewError && previewMarkdown && (
            <div className="prose dark:prose-invert max-w-none prose-p:my-2 prose-h1:mb-4 prose-h1:mt-2 prose-h2:mb-3 prose-h2:mt-1.5 prose-h3:mb-2 prose-h3:mt-1 font-body text-foreground">
              {renderMarkdownContent(previewMarkdown)}
            </div>
          )}
          {!isPreviewLoading && !previewError && !previewMarkdown && (
            <p className="text-sm text-muted-foreground">
              Select a Google Takeout folder to see a live preview.
            </p>
          )}
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl animate-in fade-in-50 duration-500 space-y-4">
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

      <div
        className={`space-y-4 min-[769px]:items-start min-[769px]:gap-6 min-[769px]:space-y-0 min-[769px]:grid ${
          isLivePreviewOpen ? 'min-[769px]:grid-cols-2' : 'min-[769px]:grid-cols-1'
        }`}
      >
        <div className="space-y-4 min-[769px]:col-span-1">
          {!isLivePreviewOpen && (
            <div className="hidden min-[769px]:flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setLivePreviewOpen(true)}
                aria-label="Show live preview"
                title="Show live preview"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Import + Live Preview */}
          <Card>
            <CardHeader className="bg-primary/10">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Upload className="h-5 w-5 text-primary" />
                <span>Step 1: Import</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-4 space-y-6">
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

              {isLivePreviewOpen && (
                <div className="min-[769px]:hidden">
                  {livePreviewPanel}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: File Name Configuration */}
          <Card>
            <CardHeader className="bg-accent/10">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Cog className="h-5 w-5 text-accent" />
                <span>Step 2: File Name Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Load Naming Preset</Label>
                <div className="flex gap-2">
                  <Select onValueChange={handleSelectNamingPreset} value={selectedNamingPreset}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a preset..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Settings</SelectItem>
                      <Separator className="my-1" />
                      {namingPresets.map(p => (
                        <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedNamingPreset && selectedNamingPreset !== 'default' && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteNamingPreset(selectedNamingPreset)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete '{selectedNamingPreset}' preset</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
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
                <div className="flex items-center space-x-2">
                    <Checkbox id="emoji" checked={namingOptions.useEmoji} onCheckedChange={(checked) => setNamingOptions(prev => ({ ...prev, useEmoji: !!checked }))} />
                    <Label htmlFor="emoji">Add emoji</Label>
                </div>
              </div>

              {isFillerTextActive && (
                <div className="space-y-2 pt-4 border-t border-border pl-6">
                  <Label htmlFor="filler-text" className="font-semibold flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    Fallback title text
                  </Label>
                  <Input
                    id="filler-text"
                    placeholder="Untitled Note"
                    value={namingOptions.fillerText}
                    onChange={(e) => setNamingOptions(p => ({...p, fillerText: e.target.value}))}
                  />
                  <p className="text-xs text-muted-foreground">This text will be used if a title cannot be generated from the note's title or body content.</p>
                </div>
              )}


              {namingOptions.useBody && (
              <div className="space-y-4 pt-4 border-t border-border pl-6">
                  <Label className="font-semibold">Title from body options</Label>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setNamingOptions(p => ({ ...p, bodyLength: Math.max(1, p.bodyLength - 1) }))}><Minus className="h-4 w-4"/></Button>
                      <span className="w-8 text-center text-sm">{namingOptions.bodyLength}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setNamingOptions(p => ({ ...p, bodyLength: p.bodyLength + 1 }))}><Plus className="h-4 w-4"/></Button>
                    </div>
                    <RadioGroup value={namingOptions.bodyUnit} onValueChange={handleBodyUnitChange} className="flex flex-wrap gap-x-4 gap-y-2">
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
              </div>
              )}

              {namingOptions.useEmoji && (
                  <div className="space-y-4 pt-4 border-t border-border pl-6">
                      <div className="space-y-2">
                          <Label className="font-semibold">Emoji</Label>
                          <RadioGroup value={namingOptions.selectedEmoji} onValueChange={(value) => setNamingOptions(p => ({...p, selectedEmoji: value}))} className="flex flex-wrap gap-x-4 gap-y-2">
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
                              className="flex flex-wrap gap-x-4 gap-y-2"
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
              
              <div className="space-y-4 pt-4 border-t">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                    <div className="flex items-center gap-2">
                        <Checkbox id="date" checked={namingOptions.useDate} onCheckedChange={(checked) => setNamingOptions(prev => ({ ...prev, useDate: !!checked, useSerial: checked ? prev.useSerial : false }))} />
                        <Label htmlFor="date" className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Add date</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox id="time" checked={namingOptions.useTime} onCheckedChange={(checked) => setNamingOptions(prev => ({ ...prev, useTime: !!checked }))}/>
                        <Label htmlFor="time" className="flex items-center gap-1"><Clock className="h-4 w-4" /> Add time</Label>
                    </div>
                </div>
                
                {(namingOptions.useDate || namingOptions.useTime) && (
                <div className="space-y-4 pt-4 border-t border-border pl-6">
                    {namingOptions.useDate && (
                        <div className="space-y-2">
                            <Label className="font-semibold">Date format</Label>
                            <RadioGroup value={namingOptions.dateFormat} onValueChange={(value) => setNamingOptions(p => ({...p, dateFormat: value}))} className="flex flex-wrap gap-x-4 gap-y-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="yyyy-MM-dd" id="df-1" />
                                    <Label htmlFor="df-1">2024-07-29</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="dd-MM-yyyy" id="df-2" />
                                    <Label htmlFor="df-2">29-07-2024</Label>                                    </div>
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
                              <SelectTrigger className="w-auto h-8 text-sm">
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
                        <RadioGroup value={namingOptions.datePosition} onValueChange={(value: 'prepend' | 'append') => setNamingOptions(prev => ({ ...prev, datePosition: value }))} className="flex flex-wrap gap-x-4 gap-y-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="prepend" id="prepend" />
                                <Label htmlFor="prepend">Prepend</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="append" id="append" />
                                <Label htmlFor="append">Append</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                )}
                
                <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <Checkbox id="serial" checked={namingOptions.useSerial} onCheckedChange={(checked) => setNamingOptions(prev => ({ ...prev, useSerial: !!checked }))} disabled={!namingOptions.useDate} />
                        <Label htmlFor="serial" className={`flex items-center ${!namingOptions.useDate ? 'text-muted-foreground' : ''}`}>
                            Add serial number
                            <InfoTooltip>Serializes notes with matching dates to prevent filename conflicts. Requires 'Add date' to be enabled.</InfoTooltip>
                        </Label>
                    </div>
                    {namingOptions.useSerial && namingOptions.useDate && (
                        <div className="space-y-2 pl-6 pt-4 border-t">
                            <Label className="font-semibold">Serial number padding</Label>
                            <RadioGroup value={namingOptions.serialPadding} onValueChange={(value) => setNamingOptions(prev => ({ ...prev, serialPadding: value as '1' | '01' | '001' | '0001' }))} className="flex flex-wrap gap-x-4 gap-y-2">
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
                </div>
              </div>

              <Separator />

              <div className="bg-secondary p-3 rounded-md text-sm text-muted-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary shrink-0"/>
                  <span className="truncate">{filenamePreview}</span>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="preset-name-save">Save Current Naming Settings as Preset</Label>
                <div className="flex gap-2">
                    <Input
                    id="preset-name-save"
                    placeholder="My Awesome Naming Preset"
                    value={presetNameToSave}
                    onChange={(e) => setPresetNameToSave(e.target.value)}
                    />
                    <Button onClick={onSavePreset}><Save className="mr-2 h-4 w-4" /> Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Markdown Formatting */}
          <Card>
            <CardHeader className="bg-accent/10">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="h-5 w-5 text-purple-400" />
                <span>Step 3: Markdown Formatting</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {renderMarkdownPresetSelect('Load Markdown Preset')}
              <Separator />
              <div className="space-y-2">
                <Label className="font-semibold flex items-center">Tag handling <span className="ml-2 text-sm font-normal text-muted-foreground">relevant for Obsidian Graphs</span><InfoTooltip>Choose how to represent Google Keep tags in Obsidian.</InfoTooltip></Label>
                <RadioGroup value={formattingOptions.tagHandling} onValueChange={(value) => setFormattingOptions(prev => ({...prev, tagHandling: value as 'links' | 'hash' | 'atlinks'}))} className="flex flex-wrap gap-4 pt-2">
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
              <Dialog>
                  <DialogTrigger asChild>
                      <Button id="preview-dialog-trigger" className="w-full" onClick={handlePreviewClick} disabled={isLoading || htmlFiles.length === 0}>
                          {isLoading && convertedFiles.length === 0 ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Eye className="mr-2 h-5 w-5" />}
                          {isLoading && convertedFiles.length === 0 ? 'Processing...' : 'Preview All Options'}
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                      <DialogHeader>
                          <DialogTitle>Conversion Preview</DialogTitle>
                          <div className="pt-2">
                            {renderMarkdownPresetSelect(
                              'Markdown Preset',
                              undefined,
                              'Select a preset to preview...',
                            )}
                          </div>
                      </DialogHeader>
                      <div className="flex-grow grid grid-cols-3 gap-4 overflow-hidden pt-4">
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

          {/* Step 4: Finish */}
          <Card>
            <CardHeader className="bg-purple-500/10">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <FileArchive className="h-5 w-5 text-purple-400" />
                <span>Step 4: Finish</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button size="lg" className="w-full text-accent-foreground" onClick={() => startConversion(htmlFiles, false)} disabled={isLoading || htmlFiles.length === 0} style={{ backgroundColor: 'hsl(var(--accent))' }}>
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
            </CardContent>
          </Card>
        </div>

        {isLivePreviewOpen && (
          <aside className="hidden min-[769px]:block min-[769px]:col-span-1">
            {livePreviewPanel}
          </aside>
        )}
      </div>
    </div>
  );
}
    

    

    
