

"use client";

import { useState, useRef, type ChangeEvent, useEffect, useMemo, useCallback } from 'react';
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
import type {
  ConvertToMarkdownOutput,
  NamingOptions,
  FormattingOptions,
} from '@/ai/schemas';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
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
import { useConversionFiles } from "@/components/feature/conversion-context";



export type RunHistoryItem = {
  id: string;
  date: string;
  hash: string;
  fileCount: number;
  fileIdentifiers: string[];
  noteHashes?: string[];
  namingOptions?: NamingOptions;
  formattingOptions?: FormattingOptions;
};

const getFileIdentifier = (file: File) => `${file.name}_${file.lastModified}`;
const getFileKey = (file: File) => `${file.name}_${file.lastModified}_${file.size}`;

const buildRunHash = (hashes: string[]) =>
  CryptoJS.SHA256([...hashes].sort().join("|")).toString();


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
  const [markdownPresetNameToSave, setMarkdownPresetNameToSave] = useState('');
  const [isLivePreviewOpen, setLivePreviewOpen] = useState(false);
  const [isPreviewVisible, setPreviewVisible] = useState(false);
  const [isPreviewClosing, setPreviewClosing] = useState(false);
  const [previewNote, setPreviewNote] = useState<ParsedKeepNote | null>(null);
  const [isPreviewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewFileMarkdown, setPreviewFileMarkdown] = useState('');
  const [isPreviewFileLoading, setPreviewFileLoading] = useState(false);
  const [previewFileError, setPreviewFileError] = useState<string | null>(null);

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
    handleSaveMarkdownPreset,
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
  const [exportDestination, setExportDestination] = useState<'zip' | 'folder'>('zip');
  const [alsoDownloadZip, setAlsoDownloadZip] = useState(true);
  const [exportName, setExportName] = useState('Insert title');
  const [exportDateFormat, setExportDateFormat] = useState<
    "yyyy-MM-dd" | "dd-MM-yyyy" | "MM-dd-yyyy" | "yyyyMMdd"
  >("yyyy-MM-dd");

  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);
  const [duplicateRun, setDuplicateRun] = useState<RunHistoryItem | null>(null);
  const [isDuplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [noteHashEntries, setNoteHashEntries] = useState<
    { file: File; key: string; hash: string }[]
  >([]);
  const [selectionHash, setSelectionHash] = useState<string | null>(null);
  const [duplicateSummary, setDuplicateSummary] = useState<{
    total: number;
    existing: number;
    newCount: number;
    exactRun: RunHistoryItem | null;
  } | null>(null);
  const [previewOffset, setPreviewOffset] = useState(96);
  const [isPreviewStuck, setPreviewStuck] = useState(false);
  const previewShellRef = useRef<HTMLDivElement | null>(null);
  const previewRafRef = useRef<number | null>(null);
  const previewCloseTimeoutRef = useRef<number | null>(null);
  
  const isFillerTextActive = !namingOptions.useTitle || !namingOptions.useBody;

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files: sharedFiles, setFiles: setSharedFiles } = useConversionFiles();
  const lastAppliedSignature = useRef<string | null>(null);
  const lastDuplicateSignature = useRef<string | null>(null);
  const [supportsDirectoryPicker, setSupportsDirectoryPicker] = useState(false);

  const buildFileSignature = (files: File[]) =>
    files.map(getFileIdentifier).sort().join("|");

  const closeLivePreviewImmediate = () => {
    if (previewCloseTimeoutRef.current !== null) {
      window.clearTimeout(previewCloseTimeoutRef.current);
      previewCloseTimeoutRef.current = null;
    }
    setPreviewClosing(false);
    setPreviewVisible(false);
    setLivePreviewOpen(false);
  };

  const openLivePreview = () => {
    if (previewCloseTimeoutRef.current !== null) {
      window.clearTimeout(previewCloseTimeoutRef.current);
      previewCloseTimeoutRef.current = null;
    }
    setPreviewClosing(false);
    setPreviewVisible(true);
    setLivePreviewOpen(true);
  };

  const closeLivePreview = () => {
    if (isPreviewClosing || !isPreviewVisible) {
      setLivePreviewOpen(false);
      return;
    }
    setPreviewClosing(true);
    setLivePreviewOpen(false);
    previewCloseTimeoutRef.current = window.setTimeout(() => {
      setPreviewClosing(false);
      setPreviewVisible(false);
      previewCloseTimeoutRef.current = null;
    }, 300);
  };

  const applySelectedFiles = (selectedFiles: File[]) => {
    setAllFiles(selectedFiles);
    const htmls = selectedFiles.filter(file => file.type === "text/html");
    setHtmlFiles(htmls);
    setAssetFiles(selectedFiles.filter(file => file.type !== "text/html"));
    setConvertedFiles([]);
    setProgress(0);
    if (htmls.length > 0) {
      openLivePreview();
    } else {
      closeLivePreviewImmediate();
    }
    lastDuplicateSignature.current = null;
  };

  const applyHtmlSelection = (selectedHtml: File[]) => {
    setHtmlFiles(selectedHtml);
    setConvertedFiles([]);
    setProgress(0);
    if (selectedHtml.length > 0) {
      openLivePreview();
    } else {
      closeLivePreviewImmediate();
    }
    setPreviewFile(null);
    setDuplicateRun(null);
    setDuplicateSummary(null);
    lastDuplicateSignature.current = null;
  };

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

  useEffect(() => {
    return () => {
      if (previewCloseTimeoutRef.current !== null) {
        window.clearTimeout(previewCloseTimeoutRef.current);
        previewCloseTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (sharedFiles.length === 0) return;
    const signature = buildFileSignature(sharedFiles);
    if (lastAppliedSignature.current === signature) return;
    lastAppliedSignature.current = signature;
    applySelectedFiles(sharedFiles);
  }, [sharedFiles]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupportsDirectoryPicker("showDirectoryPicker" in window);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const header = document.querySelector("header");
    if (!header) return;

    const updateOffset = () => {
      const height = header.getBoundingClientRect().height;
      setPreviewOffset(Math.max(72, Math.ceil(height + 16)));
    };

    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(header);
    window.addEventListener("resize", updateOffset);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOffset);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const shell = previewShellRef.current;
    if (!shell) return;

    const updateStuckState = () => {
      if (previewRafRef.current !== null) return;
      previewRafRef.current = window.requestAnimationFrame(() => {
        previewRafRef.current = null;
        const top = shell.getBoundingClientRect().top;
        setPreviewStuck(top <= previewOffset + 1);
      });
    };

    updateStuckState();
    window.addEventListener("scroll", updateStuckState, { passive: true });
    window.addEventListener("resize", updateStuckState);
    return () => {
      window.removeEventListener("scroll", updateStuckState);
      window.removeEventListener("resize", updateStuckState);
      if (previewRafRef.current !== null) {
        window.cancelAnimationFrame(previewRafRef.current);
        previewRafRef.current = null;
      }
    };
  }, [previewOffset]);

  useEffect(() => {
    let isActive = true;
    if (htmlFiles.length === 0) {
      setNoteHashEntries([]);
      setSelectionHash(null);
      return () => {
        isActive = false;
      };
    }

    const buildNoteHashes = async () => {
      const entries = await Promise.all(
        htmlFiles.map(async (file) => {
          const content = await file.text();
          return {
            file,
            key: getFileKey(file),
            hash: CryptoJS.SHA256(content).toString(),
          };
        }),
      );
      if (!isActive) return;
      setNoteHashEntries(entries);
      const hashes = entries.map((entry) => entry.hash);
      setSelectionHash(hashes.length > 0 ? buildRunHash(hashes) : null);
    };

    buildNoteHashes();
    return () => {
      isActive = false;
    };
  }, [htmlFiles]);

  useEffect(() => {
    if (!selectionHash || noteHashEntries.length === 0) {
      setDuplicateSummary(null);
      setDuplicateRun(null);
      return;
    }

    const processedHashes = new Set(
      runHistory.flatMap((run) => run.noteHashes ?? []),
    );
    const total = noteHashEntries.length;
    const existing = noteHashEntries.filter((entry) =>
      processedHashes.has(entry.hash),
    ).length;
    const newCount = total - existing;
    const exactRun =
      runHistory.find((run) => run.hash === selectionHash) ?? null;

    if (existing === 0) {
      setDuplicateSummary(null);
      setDuplicateRun(null);
      return;
    }

    setDuplicateSummary({ total, existing, newCount, exactRun });
    setDuplicateRun(exactRun);

    if (lastDuplicateSignature.current !== selectionHash) {
      setDuplicateDialogOpen(true);
      lastDuplicateSignature.current = selectionHash;
    }
  }, [noteHashEntries, runHistory, selectionHash]);
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
    if (!event.target.files) return;
    const ignoredFiles = [".DS_Store", "Thumbs.db"];
    const selectedFiles = Array.from(event.target.files).filter(
      file => !ignoredFiles.includes(file.name)
    );

    if (selectedFiles.length === 0) return;
    applySelectedFiles(selectedFiles);
    setSharedFiles(selectedFiles);
    lastAppliedSignature.current = buildFileSignature(selectedFiles);
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

  const livePreviewFilename = useMemo(() => {
    if (!previewNote) return filenamePreview;
    return buildFilename({ note: previewNote, options: namingOptions, serial: 1 });
  }, [filenamePreview, namingOptions, previewNote]);

  const assetUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    const normalizeKey = (value: string) => value.toLowerCase();
    const stripExtension = (value: string) => value.replace(/\.[^.]+$/, "");
    const addKey = (key: string, url: string) => {
      map.set(key, url);
      map.set(normalizeKey(key), url);
      map.set(stripExtension(key), url);
      map.set(stripExtension(normalizeKey(key)), url);
    };
    assetFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      addKey(file.name, url);
      const relativePath = (file as File & { webkitRelativePath?: string })
        .webkitRelativePath;
      if (relativePath) {
        addKey(relativePath, url);
        const baseName = relativePath.split("/").pop();
        if (baseName) {
          addKey(baseName, url);
        }
      }
    });
    return map;
  }, [assetFiles]);

  useEffect(() => {
    return () => {
      assetUrlMap.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [assetUrlMap]);

  const normalizeMarkdownImages = useCallback((markdown: string) => {
    return markdown.replace(/!\[\[([^\]]+)\]\]/g, (_match, rawName) => {
      const name = String(rawName ?? '').trim();
      if (!name) return _match;
      return `![${name}](keep-asset://${encodeURIComponent(name)})`;
    });
  }, []);

  const resolveAssetSrc = useCallback(
    (src?: string) => {
      if (!src) return null;
      let decodedSrc = src;
      try {
        decodedSrc = decodeURIComponent(src);
      } catch {
        decodedSrc = src;
      }
      const cleanSrc = decodedSrc.split("?")[0]?.split("#")[0] ?? decodedSrc;
      const lookup = (value: string) =>
        assetUrlMap.get(value) ?? assetUrlMap.get(value.toLowerCase());
      const findBySuffix = (value: string) => {
        const normalized = value.toLowerCase();
        for (const [key, url] of assetUrlMap) {
          if (key.toLowerCase().endsWith(normalized)) {
            return url;
          }
        }
        return null;
      };
      if (cleanSrc.startsWith("keep-asset://")) {
        const name = cleanSrc.replace("keep-asset://", "");
        return lookup(name) ?? findBySuffix(name);
      }
      const filename = cleanSrc.split("/").pop();
      if (filename) {
        return lookup(filename) ?? findBySuffix(filename);
      }
      return lookup(cleanSrc) ?? findBySuffix(cleanSrc) ?? cleanSrc;
    },
    [assetUrlMap],
  );

  const previewMarkdownNormalized = useMemo(
    () => normalizeMarkdownImages(previewMarkdown),
    [normalizeMarkdownImages, previewMarkdown],
  );

  useEffect(() => {
    let isActive = true;
    if (!previewFile) {
      setPreviewFileMarkdown('');
      setPreviewFileError(null);
      setPreviewFileLoading(false);
      return () => {
        isActive = false;
      };
    }

    const sourceFile =
      htmlFiles.find((file) => file.name === previewFile.originalPath) ?? null;
    if (!sourceFile) {
      setPreviewFileMarkdown(normalizeMarkdownImages(previewFile.content));
      setPreviewFileError(null);
      setPreviewFileLoading(false);
      return () => {
        isActive = false;
      };
    }

    setPreviewFileLoading(true);
    setPreviewFileError(null);
    sourceFile
      .text()
      .then((content) => {
        if (!isActive) return;
        const data = parseKeepHtml(content);
        const markdownContent = formatMarkdown(data, formattingOptions);
        setPreviewFileMarkdown(normalizeMarkdownImages(markdownContent));
      })
      .catch((error) => {
        if (!isActive) return;
        setPreviewFileMarkdown(normalizeMarkdownImages(previewFile.content));
        setPreviewFileError(
          error instanceof Error ? error.message : 'Unable to refresh preview.',
        );
      })
      .finally(() => {
        if (!isActive) return;
        setPreviewFileLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [
    formattingOptions,
    htmlFiles,
    normalizeMarkdownImages,
    previewFile,
  ]);

  const markdownComponents = useMemo(
    () => ({
      img: ({
        src,
        alt,
      }: {
        src?: string;
        alt?: string;
      }) => {
        const resolvedSrc = resolveAssetSrc(src);
        if (!resolvedSrc) {
          return (
            <span className="text-xs text-muted-foreground italic">
              Image not found: {alt ?? src ?? "unknown"}
            </span>
          );
        }
        return (
          <img
            src={resolvedSrc}
            alt={alt ?? ""}
            className="max-w-full rounded-lg my-4"
          />
        );
      },
      input: ({
        type,
        checked,
      }: {
        type?: string;
        checked?: boolean;
      }) => {
        if (type !== "checkbox") return null;
        return (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className="mr-2 align-middle accent-primary"
          />
        );
      },
      ul: ({
        node,
        className,
        ...props
      }: {
        node?: { properties?: { className?: string[] | string } };
        className?: string;
        children?: React.ReactNode;
      }) => {
        const classes = node?.properties?.className;
        const classList = Array.isArray(classes)
          ? classes
          : ([classes].filter(Boolean) as string[]);
        const isTaskList = classList?.includes("contains-task-list");
        return (
          <ul
            {...props}
            className={cn(className, isTaskList ? "list-none pl-0" : undefined)}
          />
        );
      },
      ol: ({
        node,
        className,
        ...props
      }: {
        node?: { properties?: { className?: string[] | string } };
        className?: string;
        children?: React.ReactNode;
      }) => {
        const classes = node?.properties?.className;
        const classList = Array.isArray(classes)
          ? classes
          : ([classes].filter(Boolean) as string[]);
        const isTaskList = classList?.includes("contains-task-list");
        return (
          <ol
            {...props}
            className={cn(className, isTaskList ? "list-none pl-0" : undefined)}
          />
        );
      },
      li: ({
        node,
        className,
        ...props
      }: {
        node?: { properties?: { className?: string[] | string } };
        className?: string;
        children?: React.ReactNode;
      }) => {
        const classes = node?.properties?.className;
        const classList = Array.isArray(classes)
          ? classes
          : ([classes].filter(Boolean) as string[]);
        const isTaskItem = classList?.includes("task-list-item");
        return (
          <li
            {...props}
            className={cn(className, isTaskItem ? "list-none" : undefined)}
          />
        );
      },
    }),
    [resolveAssetSrc],
  );
  
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
      return;
    } else if (action === 'new') {
      const processedHashes = new Set(
        runHistory.flatMap(run => run.noteHashes ?? [])
      );
      const newFiles = noteHashEntries
        .filter(entry => !processedHashes.has(entry.hash))
        .map(entry => entry.file);
      
      if(newFiles.length === 0) {
        toast({
          title: "No New Files",
          description: "All notes in this selection have been converted in previous runs.",
        });
        return;
      }
      toast({
        title: "Selection Updated",
        description: `Keeping ${newFiles.length} new note${newFiles.length === 1 ? "" : "s"}.`,
      });
      applyHtmlSelection(newFiles);
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
    const noteHashesForRun: string[] = [];
  
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
        if (!preview) {
          noteHashesForRun.push(CryptoJS.SHA256(fileContent).toString());
        }
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
          setStatusText('Conversion complete! Preparing export...');
          const exportLabel = buildExportLabel();
          if (exportDestination === 'folder') {
            const folderExported = await exportAsFolder(
              result.convertedFiles,
              exportLabel,
            );
            if (!folderExported && !alsoDownloadZip) {
              return;
            }
            if (alsoDownloadZip) {
              await downloadAllAsZip(result.convertedFiles, exportLabel);
            }
          } else {
            await downloadAllAsZip(result.convertedFiles, exportLabel);
          }
          
          const currentHash = buildRunHash(noteHashesForRun);
          const fileIdentifiers = filesToProcess.map(getFileIdentifier);
          addToHistory({
            hash: currentHash,
            fileCount: filesToProcess.length,
            fileIdentifiers,
            noteHashes: noteHashesForRun,
            namingOptions,
            formattingOptions,
          });

          toast({
              title: "Conversion Successful",
              description: `${totalFiles} notes and ${assetFiles.length} assets prepared. Run hash and settings saved in Settings > Sync & History.`,
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
  
  const downloadAllAsZip = async (
    filesToDownload = convertedFiles,
    exportLabel = buildExportLabel(),
  ) => {
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
    a.download = `${exportLabel}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusText('Download started!');
  }

  const exportAsFolder = async (
    filesToDownload = convertedFiles,
    exportLabel = buildExportLabel(),
  ) => {
    if (!supportsDirectoryPicker) {
      toast({
        variant: "destructive",
        title: "Folder export unavailable",
        description: "Your browser doesn't support folder export. Download a .zip instead.",
      });
      return false;
    }

    setStatusText("Choose an export folder...");
    let rootHandle: FileSystemDirectoryHandle;
    try {
      const picker = (window as Window & {
        showDirectoryPicker?: (options?: { mode?: "readwrite" }) => Promise<FileSystemDirectoryHandle>;
      }).showDirectoryPicker;
      if (!picker) {
        throw new Error("Directory picker unavailable.");
      }
      rootHandle = await picker({ mode: "readwrite" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        toast({
          title: "Export canceled",
          description: "Folder selection was canceled.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Export failed",
          description: "Unable to access the selected folder.",
        });
      }
      return false;
    }

    let exportHandle: FileSystemDirectoryHandle;
    try {
      exportHandle = await rootHandle.getDirectoryHandle(exportLabel, { create: true });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Unable to create the export folder.",
      });
      return false;
    }

    const totalFiles = Math.max(1, filesToDownload.length + assetFiles.length);
    let completed = 0;
    setStatusText("Writing files...");
    setProgress(0);

    const writeFile = async (name: string, content: BlobPart) => {
      const fileHandle = await exportHandle.getFileHandle(name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      completed += 1;
      setProgress((completed / totalFiles) * 100);
    };

    for (const file of filesToDownload) {
      await writeFile(file.newPath, file.content);
    }
    for (const file of assetFiles) {
      await writeFile(file.name, file);
    }

    setStatusText(`Exported to folder: ${exportLabel}`);
    return true;
  };


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

  const buildExportBaseName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "KeepToMD-Export";
    return trimmed.replace(/[\\/]/g, "-");
  };

  const buildExportLabel = () => {
    const base = buildExportBaseName(exportName);
    const timestamp = format(new Date(), exportDateFormat);
    return `${timestamp} - ${base}`;
  };

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

  const onSaveMarkdownPreset = () => {
    if (!markdownPresetNameToSave) {
      toast({ variant: 'destructive', title: 'Preset name cannot be empty.' });
      return;
    }
    handleSaveMarkdownPreset(markdownPresetNameToSave);
    toast({
      title: 'Preset Saved',
      description: `Preset "${markdownPresetNameToSave}" has been saved.`,
    });
    setMarkdownPresetNameToSave('');
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

  const renderTagHandlingOptions = (compact = false, idPrefix = "format") => (
    <div className="space-y-2">
      <Label className="font-semibold flex items-center">
        Tag handling
        {!compact && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            relevant for Obsidian Graphs
          </span>
        )}
        <InfoTooltip>
          Choose how to represent Google Keep tags in Obsidian.
        </InfoTooltip>
      </Label>
      <RadioGroup
        value={formattingOptions.tagHandling}
        onValueChange={(value) =>
          setFormattingOptions((prev) => ({
            ...prev,
            tagHandling: value as 'links' | 'hash' | 'atlinks',
          }))
        }
        className={`flex flex-wrap gap-4 ${compact ? '' : 'pt-2'}`}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="links" id={`${idPrefix}-tag-links`} />
          <Label htmlFor={`${idPrefix}-tag-links`}>Links (notes)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="hash" id={`${idPrefix}-tag-hash`} />
          <Label htmlFor={`${idPrefix}-tag-hash`}>#Hashtags</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="atlinks" id={`${idPrefix}-tag-atlinks`} />
          <Label htmlFor={`${idPrefix}-tag-atlinks`}>@Mentions</Label>
        </div>
      </RadioGroup>
    </div>
  );

  const renderChecklistOptions = (compact = false, idPrefix = "format") => (
    <div className="space-y-2">
      <Label className="font-semibold flex items-center">
        Checklist formatting
        <InfoTooltip>
          Choose how Google Keep checklists are represented in the exported
          Markdown.
        </InfoTooltip>
      </Label>
      <RadioGroup
        value={formattingOptions.checkboxStyle ?? "markdown"}
        onValueChange={(value) =>
          setFormattingOptions((prev) => ({
            ...prev,
            checkboxStyle: value as
              | "markdown"
              | "hyphen"
              | "bullet"
              | "numbered",
          }))
        }
        className={`flex flex-wrap gap-4 ${compact ? '' : 'pt-2'}`}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="markdown" id={`${idPrefix}-check-markdown`} />
          <Label htmlFor={`${idPrefix}-check-markdown`}>Markdown checkboxes</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="hyphen" id={`${idPrefix}-check-hyphen`} />
          <Label htmlFor={`${idPrefix}-check-hyphen`}>Hyphens</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="bullet" id={`${idPrefix}-check-bullet`} />
          <Label htmlFor={`${idPrefix}-check-bullet`}>Bullets</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="numbered" id={`${idPrefix}-check-numbered`} />
          <Label htmlFor={`${idPrefix}-check-numbered`}>Numbered list</Label>
        </div>
      </RadioGroup>
    </div>
  );

  const previewState = isPreviewClosing
    ? "closing"
    : isLivePreviewOpen
      ? "open"
      : "collapsed";

  const livePreviewPanel = (
    <div
      ref={previewShellRef}
      data-stuck={isPreviewStuck ? "true" : "false"}
      data-state={previewState}
      style={{ ["--preview-top" as string]: `${previewOffset}px` }}
      className="rounded-lg border bg-card/70 transition-[transform,box-shadow,border-color,opacity] duration-300 ease-out data-[state=closing]:opacity-0 data-[state=closing]:scale-[0.98] data-[state=closing]:pointer-events-none data-[state=collapsed]:opacity-0 data-[state=collapsed]:scale-[0.98] data-[state=collapsed]:pointer-events-none min-[769px]:sticky min-[769px]:top-[var(--preview-top)] min-[769px]:flex min-[769px]:h-[calc(100svh-var(--preview-top)-1.5rem)] min-[769px]:flex-col min-[769px]:will-change-transform min-[769px]:data-[stuck=true]:-translate-y-1 min-[769px]:data-[stuck=true]:border-primary/30 min-[769px]:data-[stuck=true]:shadow-[0_22px_60px_-36px_rgba(15,23,42,0.55)]"
    >
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
          onClick={closeLivePreview}
          aria-label="Hide live preview"
          title="Hide live preview"
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3 px-4 pt-3">
        {renderMarkdownPresetSelect('Markdown Preset')}
        <div className="bg-secondary p-3 rounded-md text-sm text-muted-foreground flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">{livePreviewFilename}</span>
        </div>
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
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {previewMarkdownNormalized}
              </ReactMarkdown>
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
              {duplicateSummary ? (
                duplicateSummary.exactRun && duplicateSummary.newCount === 0 ? (
                  <>
                    All {duplicateSummary.total} notes in this selection were
                    converted on{" "}
                    {format(new Date(duplicateSummary.exactRun.date), "PPpp")}.
                    How would you like to proceed?
                  </>
                ) : (
                  <>
                    We found {duplicateSummary.existing} of{" "}
                    {duplicateSummary.total} notes already converted.{" "}
                    {duplicateSummary.newCount} new{" "}
                    {duplicateSummary.newCount === 1 ? "note" : "notes"} remain.
                  </>
                )
              ) : (
                <>
                  Some notes in this selection were converted before. How would
                  you like to proceed?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="text-xs text-muted-foreground">
            No conversion will run until you click Convert.
          </p>
          <AlertDialogFooter className="flex-row justify-end gap-2">
            <Button variant="secondary" onClick={() => handleDuplicateDialogAction('all')}>
                Keep All Selected
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDuplicateDialogAction('new')}
              disabled={duplicateSummary?.newCount === 0}
            >
              Keep Only New Files
            </Button>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className={`space-y-4 min-[769px]:gap-6 min-[769px]:space-y-0 min-[769px]:items-stretch min-[769px]:grid min-[769px]:transition-[grid-template-columns] min-[769px]:duration-300 min-[769px]:ease-out ${
          isLivePreviewOpen
            ? 'min-[769px]:grid-cols-[minmax(0,1fr)_420px]'
            : 'min-[769px]:grid-cols-[minmax(0,1fr)_72px]'
        }`}
      >
        <div className="space-y-4 min-[769px]:col-span-1">
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
                {!isPreviewVisible && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start min-[769px]:hidden"
                    onClick={openLivePreview}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Show live preview
                  </Button>
                )}
                <div className="flex items-center gap-2 rounded-lg bg-background/50 p-3 text-sm text-muted-foreground">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-accent" />
                  <p>Your files are processed locally in your browser and never leave your device.</p>
                </div>
              </div>

              {isPreviewVisible && (
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
                                    <Label htmlFor="df-1">YYYY-MM-DD</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="dd-MM-yyyy" id="df-2" />
                                    <Label htmlFor="df-2">DD-MM-YYYY</Label>                                    </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="MM-dd-yyyy" id="df-3" />
                                    <Label htmlFor="df-3">MM-DD-YYYY</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="yyyyMMdd" id="df-4" />
                                    <Label htmlFor="df-4">YYYYMMDD</Label>
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

              {!isPreviewVisible && (
                <>
                  <Separator />
                  <div className="bg-secondary p-3 rounded-md text-sm text-muted-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{filenamePreview}</span>
                  </div>
                </>
              )}

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
              {renderTagHandlingOptions()}
              <Separator />
              {renderChecklistOptions()}
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="markdown-preset-name-save">
                  Save current formatting as preset
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="markdown-preset-name-save"
                    placeholder="My Markdown Preset"
                    value={markdownPresetNameToSave}
                    onChange={(e) => setMarkdownPresetNameToSave(e.target.value)}
                  />
                  <Button onClick={onSaveMarkdownPreset}>
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                </div>
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
                          <div className="grid gap-4 pt-3 sm:grid-cols-2">
                            {renderTagHandlingOptions(true, "preview")}
                            {renderChecklistOptions(true, "preview")}
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
                                      {isPreviewFileLoading && (
                                        <p className="text-xs text-muted-foreground mb-2">
                                          Updating preview…
                                        </p>
                                      )}
                                      {!isPreviewFileLoading && previewFileError && (
                                        <p className="text-xs text-destructive mb-2">
                                          {previewFileError}
                                        </p>
                                      )}
                                      <div className="prose dark:prose-invert max-w-none prose-p:my-2 prose-h1:mb-4 prose-h1:mt-2 prose-h2:mb-3 prose-h2:mt-1.5 prose-h3:mb-2 prose-h3:mt-1 font-body text-foreground">
                                        <ReactMarkdown
                                          remarkPlugins={[remarkGfm]}
                                          components={markdownComponents}
                                        >
                                          {previewFileMarkdown}
                                        </ReactMarkdown>
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="export-name" className="font-semibold">
                      Export name
                    </Label>
                    <Input
                      id="export-name"
                      value={exportName}
                      onChange={(e) => setExportName(e.target.value)}
                      placeholder="Insert title"
                    />
                    <p className="text-xs text-muted-foreground">
                      The date is appended automatically:{" "}
                      <span className="font-medium text-foreground">
                        {buildExportLabel()}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Export date format</Label>
                    <RadioGroup
                      value={exportDateFormat}
                      onValueChange={(value) =>
                        setExportDateFormat(
                          value as "yyyy-MM-dd" | "dd-MM-yyyy" | "MM-dd-yyyy" | "yyyyMMdd"
                        )
                      }
                      className="flex flex-wrap gap-4 pt-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yyyy-MM-dd" id="export-date-1" />
                        <Label htmlFor="export-date-1">YYYY-MM-DD</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dd-MM-yyyy" id="export-date-2" />
                        <Label htmlFor="export-date-2">DD-MM-YYYY</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="MM-dd-yyyy" id="export-date-3" />
                        <Label htmlFor="export-date-3">MM-DD-YYYY</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yyyyMMdd" id="export-date-4" />
                        <Label htmlFor="export-date-4">YYYYMMDD</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Export destination</Label>
                    <RadioGroup
                      value={exportDestination}
                      onValueChange={(value) =>
                        setExportDestination(value as "zip" | "folder")
                      }
                      className="flex flex-col gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="zip" id="export-zip" />
                        <Label htmlFor="export-zip">
                          Download .zip (recommended)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="folder"
                          id="export-folder"
                          disabled={!supportsDirectoryPicker}
                        />
                        <Label
                          htmlFor="export-folder"
                          className={
                            supportsDirectoryPicker ? undefined : "text-muted-foreground"
                          }
                        >
                          Export to folder
                        </Label>
                        {!supportsDirectoryPicker && (
                          <span className="text-xs text-muted-foreground">
                            Desktop Chrome only
                          </span>
                        )}
                      </div>
                    </RadioGroup>
                  </div>

                  {exportDestination === "folder" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="also-zip"
                        checked={alsoDownloadZip}
                        onCheckedChange={(checked) =>
                          setAlsoDownloadZip(Boolean(checked))
                        }
                      />
                      <Label htmlFor="also-zip">
                        Also download a .zip copy
                      </Label>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                  <Button
                    size="lg"
                    className="w-full text-accent-foreground"
                    onClick={() => startConversion(htmlFiles, false)}
                    disabled={isLoading || htmlFiles.length === 0}
                    style={{ backgroundColor: 'hsl(var(--accent))' }}
                  >
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                      {isLoading
                        ? 'Processing...'
                        : exportDestination === 'folder'
                          ? 'Convert & Export Folder'
                          : 'Convert & Download .zip'}
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
                          {exportDestination === "folder" ? (
                            <p>
                              This will export {htmlFiles.length} notes and{" "}
                              {assetFiles.length} assets into a folder named{" "}
                              {buildExportLabel()}.
                            </p>
                          ) : (
                            <p>
                              This will download a single .zip file containing{" "}
                              {htmlFiles.length} converted notes and{" "}
                              {assetFiles.length} assets.
                            </p>
                          )}
                          <p>
                            For best results in Obsidian, keep your assets in the
                            same folder as your notes.
                          </p>
                      </div>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="hidden min-[769px]:block min-[769px]:col-span-1">
          <div className="h-full">
            {isPreviewVisible && livePreviewPanel}
            <div
              data-state={previewState}
              style={{ ["--preview-top" as string]: `${previewOffset}px` }}
              className="min-[769px]:sticky min-[769px]:top-[var(--preview-top)] flex flex-col items-center gap-3 rounded-lg border bg-card/70 px-2 py-3 data-[state=open]:hidden data-[state=closing]:hidden"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={openLivePreview}
                aria-label="Show live preview"
                title="Show live preview"
              >
                <Eye className="h-5 w-5" />
              </Button>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Preview
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
    

    

    
