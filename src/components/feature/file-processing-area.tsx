

"use client";

import { useState, useRef, type ChangeEvent } from 'react';
import {
  Upload,
  Folder,
  Cog,
  FileText,
  Eye,
  Settings,
  Info,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Save,
  CheckCircle,
  Download,
  Loader2
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { convertToMarkdown } from '@/ai/flows/convert-to-markdown-flow';
import type { ConvertToMarkdownInput, ConvertToMarkdownOutput, FormattingOptions, NamingOptions } from '@/ai/schemas';

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
  const [files, setFiles] = useState<File[]>([]);
  const [namingOptions, setNamingOptions] = useState<NamingOptions>({
    useTitle: true,
    useBody: true,
    bodyLength: 30,
    bodyUnit: 'characters',
    useDate: true,
    useTime: false,
    useSerial: false,
    datePosition: 'prepend',
    serialPadding: '1',
  });
  const [formattingOptions, setFormattingOptions] = useState<FormattingOptions>({
    tagHandling: 'hash',
  });
  const [convertedFiles, setConvertedFiles] = useState<ConvertToMarkdownOutput['convertedFiles']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<typeof convertedFiles[0] | null>(null);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files).filter(file => file.type === 'text/html'));
    }
  };

  const handleRunConversion = async (preview = false) => {
    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "No files selected",
        description: "Please select your Google Keep HTML files first.",
      });
      return;
    }

    setIsLoading(true);
    if (!preview) {
      setConvertedFiles([]);
    }

    try {
      const fileContents = await Promise.all(
        files.map(file =>
          new Promise<{ path: string; content: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({ path: file.name, content: e.target?.result as string });
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
          })
        )
      );

      const input: ConvertToMarkdownInput = {
        files: fileContents,
        namingOptions,
        formattingOptions,
      };

      const result = await convertToMarkdown(input);

      if (result && result.convertedFiles) {
        setConvertedFiles(result.convertedFiles);
        toast({
          title: "Conversion Successful",
          description: `${result.convertedFiles.length} files have been converted.`,
        });
        if (preview && result.convertedFiles.length > 0) {
            setPreviewFile(result.convertedFiles[0]);
            document.getElementById('preview-dialog-trigger')?.click();
        } else if (!preview) {
            downloadAllFiles(result.convertedFiles);
        }
      } else {
        throw new Error("Conversion resulted in an unexpected format.");
      }
    } catch (error) {
      console.error("Conversion failed:", error);
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const downloadFile = (file: typeof convertedFiles[0]) => {
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
  
  const downloadAllFiles = (filesToDownload = convertedFiles) => {
    filesToDownload.forEach(file => downloadFile(file));
  }


  const getFilenamePreview = () => {
    const parts: string[] = [];
    const datePart = '2024-01-23';
    const timePart = '12-34-56';
    const dateTimePart = [namingOptions.useDate ? datePart : null, namingOptions.useTime ? timePart : null].filter(Boolean).join('_');

    if (namingOptions.datePosition === 'prepend' && dateTimePart) {
        parts.push(dateTimePart);
    }

    let titlePart = 'My Note Title';
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
        titlePart = bodySnippet;
    } else if (namingOptions.useTitle) {
      // Show title
    } else if (namingOptions.useBody) {
      titlePart = `My Note Title (or first ${namingOptions.bodyLength} ${namingOptions.bodyUnit} of body)`;
    } else {
        titlePart = "";
    }
    
    if (titlePart) parts.push(titlePart);
    
    if (namingOptions.datePosition === 'append' && dateTimePart) {
        parts.push(dateTimePart);
    }
    
    if (namingOptions.useSerial) {
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

    return preview + '.md';
  }

  const handlePreviewClick = async () => {
    await handleRunConversion(true);
  }

  // A simple function to convert markdown-style image links to HTML img tags
  const renderMarkdownContent = (content: string) => {
    // Convert Obsidian-style wikilinks for images to standard markdown
    let renderedContent = content.replace(/!\[\[(.*?)\]\]/g, (match, p1) => {
      // For the preview, we need a valid src. Since we don't have the images,
      // we'll use a placeholder. This part would need actual image handling
      // if the source images were available to the component.
      // For now, let's assume attachments are handled separately or we just show the name.
      return `\n**Attachment:** ${p1}\n`;
    });
    
    // This is a very basic renderer. For a full-featured preview,
    // a library like 'react-markdown' would be ideal.
    return renderedContent.split('\n').map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-3 mb-1.5">{line.substring(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-2 mb-1">{line.substring(4)}</h3>;
        if (line.startsWith('**Tags:**')) return <p key={i} className="my-2">{line}</p>;
        if (line.startsWith('**Created:**')) return <p key={i} className="text-sm text-muted-foreground mb-4">{line}</p>;
        if (line.trim() === '') return <br key={i} />;
        return <p key={i}>{line}</p>;
    });
  }

  return (
    <div className="w-full max-w-4xl animate-in fade-in-50 duration-500">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept=".html"
        webkitdirectory=""
      />
      <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full space-y-4">
        {/* Import Section */}
        <AccordionItem value="item-1" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-6 py-4 text-lg font-semibold bg-primary/10 hover:no-underline [&[data-state=open]>svg]:hidden [&[data-state=closed]>svg]:hidden">
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
                {files.length > 0 ? `${files.length} file(s) selected` : 'Source Folder / Files'}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Process Section */}
        <AccordionItem value="item-2" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-6 py-4 text-lg font-semibold bg-accent/10 hover:no-underline [&[data-state=open]>svg]:hidden [&[data-state=closed]>svg]:hidden">
             <div className="flex items-center gap-2">
                <Cog className="h-5 w-5 text-accent" />
                <span>Process</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-4 pb-6 space-y-4">
            <Card className="bg-background/50">
                <CardHeader>
                    <CardTitle className="flex items-center text-base">
                        File (Re)Naming
                        <div className="flex-grow" />
                        <InfoTooltip>Configure how your output files will be named.</InfoTooltip>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-center">
                         <div className="flex items-center space-x-2">
                            <Checkbox id="title" checked={namingOptions.useTitle} onCheckedChange={(checked) => setNamingOptions(prev => ({ ...prev, useTitle: !!checked }))} />
                            <Label htmlFor="title">From Title</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="body" checked={namingOptions.useBody} onCheckedChange={(checked) => setNamingOptions(prev => ({ ...prev, useBody: !!checked }))} />
                            <Label htmlFor="body" className="flex items-center">
                              From Body
                              <InfoTooltip>Use the first part of the body as a fallback if the note has no title.</InfoTooltip>
                            </Label>
                        </div>
                        <div/>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="date" checked={namingOptions.useDate} onCheckedChange={(checked) => setNamingOptions(prev => ({ ...prev, useDate: !!checked }))} />
                            <Label htmlFor="date">Date</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="time" checked={namingOptions.useTime} onCheckedChange={(checked) => setNamingOptions(prev => ({ ...prev, useTime: !!checked }))}/>
                            <Label htmlFor="time">Time</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="serial" checked={namingOptions.useSerial} onCheckedChange={(checked) => setNamingOptions(prev => ({ ...prev, useSerial: !!checked }))} />
                            <Label htmlFor="serial">Serial</Label>
                        </div>
                    </div>
                    
                    {namingOptions.useBody && (
                    <div className="space-y-2 pt-4 border-t border-border">
                        <Label className="font-semibold">Body for title options</Label>
                        <div className="flex items-center space-x-2">
                           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setNamingOptions(p => ({ ...p, bodyLength: Math.max(1, p.bodyLength - 1) }))}><Minus className="h-4 w-4"/></Button>
                           <span className="w-8 text-center text-sm">{namingOptions.bodyLength}</span>
                           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setNamingOptions(p => ({ ...p, bodyLength: p.bodyLength + 1 }))}><Plus className="h-4 w-4"/></Button>
                           <Select value={namingOptions.bodyUnit} onValueChange={(value: 'characters' | 'words' | 'lines') => setNamingOptions(p => ({...p, bodyUnit: value}))}>
                               <SelectTrigger className="w-[120px] h-7 text-sm">
                                   <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                   <SelectItem value="characters">characters</SelectItem>
                                   <SelectItem value="words">words</SelectItem>
                                   <SelectItem value="lines">lines</SelectItem>
                               </SelectContent>
                           </Select>
                        </div>
                    </div>
                    )}


                    {namingOptions.useDate && (
                    <div className="space-y-2 pt-4 border-t border-border">
                        <Label className="font-semibold">Date <span className="text-muted-foreground font-normal">sorting is chronological</span></Label>
                        <RadioGroup value={namingOptions.datePosition} onValueChange={(value: 'prepend' | 'append') => setNamingOptions(prev => ({ ...prev, datePosition: value }))} className="flex mt-2">
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
                    )}

                    {namingOptions.useSerial && (
                    <div className="space-y-2 pt-4 border-t border-border">
                        <Label className="font-semibold flex items-center">Serial start with <InfoTooltip>Choose the padding for your serial numbers.</InfoTooltip></Label>
                        <RadioGroup value={namingOptions.serialPadding} onValueChange={(value) => setNamingOptions(prev => ({ ...prev, serialPadding: value as '1' | '01' | '001' | '0001' }))} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="1" id="s1" />
                                <Label htmlFor="s1">1</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="01" id="s01" />
                                <Label htmlFor="s01">01</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="001" id="s001" />
                                <Label htmlFor="s001">001</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="0001" id="s0001" />
                                <Label htmlFor="s0001">0001</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    )}

                    <div className="bg-secondary p-3 rounded-md text-sm text-muted-foreground flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary shrink-0"/>
                        <span className="truncate">{getFilenamePreview()}</span>
                    </div>

                </CardContent>
            </Card>

            <Card className="bg-background/50">
                 <CardHeader>
                    <CardTitle className="flex items-center text-base">
                        File formatting
                        <span className="ml-2 text-sm font-normal text-muted-foreground">relevant for Obsidian</span>
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
                                <Label htmlFor="hash">#Hash</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="atlinks" id="atlinks" />
                                <Label htmlFor="atlinks">@Links</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </CardContent>
            </Card>

          </AccordionContent>
        </AccordionItem>

        {/* Finish Section */}
        <AccordionItem value="item-3" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-6 py-4 text-lg font-semibold bg-purple-500/10 hover:no-underline [&[data-state=open]>svg]:hidden [&[data-state=closed]>svg]:hidden">
             <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                <span>Finish</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-4 pb-6">
            <div className="flex flex-col sm:flex-row gap-4">
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button id="preview-dialog-trigger" size="lg" className="w-full" onClick={handlePreviewClick} disabled={isLoading || files.length === 0}>
                            {isLoading && convertedFiles.length === 0 ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Eye className="mr-2 h-5 w-5" />}
                            {isLoading && convertedFiles.length === 0 ? 'Processing...' : 'Preview'}
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
                                        <div className="prose prose-invert max-w-none prose-p:my-2 prose-h1:mb-4 prose-h1:mt-2 prose-h2:mb-3 prose-h2:mt-1.5 prose-h3:mb-2 prose-h3:mt-1 font-body text-foreground">
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
                            {previewFile && <Button variant="outline" onClick={() => downloadFile(previewFile)}>Download Selected</Button>}
                            <Button onClick={() => downloadAllFiles()}>Download All</Button>
                        </div>
                    </DialogContent>
                 </Dialog>

                <Button size="lg" variant="secondary" className="w-full" onClick={() => handleRunConversion(false)} disabled={isLoading || files.length === 0}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Settings className="mr-2 h-5 w-5" />}
                    {isLoading ? 'Processing...' : 'Run Conversion & Download'}
                </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

    