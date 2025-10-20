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
  const [bodyChars, setBodyChars] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full max-w-4xl animate-in fade-in-50 duration-500">
      <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full space-y-4">
        {/* Import Section */}
        <AccordionItem value="item-1" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-6 py-4 text-lg font-semibold bg-primary/10 hover:no-underline">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <span>Import</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-4 pb-6">
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start h-12 text-base">
                <Folder className="mr-2 h-5 w-5" />
                Source Folder
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 text-base">
                <Folder className="mr-2 h-5 w-5" />
                Output Folder
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Process Section */}
        <AccordionItem value="item-2" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-6 py-4 text-lg font-semibold bg-accent/10 hover:no-underline">
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
                        <CheckCircle className="ml-2 h-5 w-5 text-green-500"/>
                        <div className="flex-grow" />
                        <InfoTooltip>Configure how your output files will be named.</InfoTooltip>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Select from templates" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="template1">Default Template</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                         <div className="flex items-center space-x-2">
                            <Checkbox id="title" defaultChecked/>
                            <Label htmlFor="title">Title</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="body" defaultChecked/>
                            <Label htmlFor="body">Body</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setBodyChars(p => p > 0 ? p -1 : 0)}><Minus className="h-4 w-4"/></Button>
                           <span className="w-6 text-center">{bodyChars}</span>
                           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setBodyChars(p => p + 1)}><Plus className="h-4 w-4"/></Button>
                           <Label>Chars</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="date" defaultChecked/>
                            <Label htmlFor="date">Date</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="time" />
                            <Label htmlFor="time">Time</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="serial" />
                            <Label htmlFor="serial">Serial</Label>
                        </div>
                    </div>

                    <div>
                        <Label className="font-semibold">Date <span className="text-muted-foreground font-normal">sorting is chronological</span></Label>
                        <RadioGroup defaultValue="prepend" className="flex mt-2">
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

                    <div>
                        <Label className="font-semibold flex items-center">Serial start with <InfoTooltip>Choose the padding for your serial numbers.</InfoTooltip></Label>
                        <RadioGroup defaultValue="1" className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
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

                    <div className="bg-secondary p-3 rounded-md text-sm text-muted-foreground flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary shrink-0"/>
                        <span className="truncate">2024-01-23 - Insert Title - Do you ever feel like a plastic bag...</span>
                    </div>

                     <div className="flex gap-2">
                        <Input placeholder="New template name" />
                        <Button variant="outline"><Save className="mr-2 h-4 w-4"/> Save</Button>
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
                <CardContent className="space-y-4">
                     <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Select from Obsidian templates" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="template1">Default</SelectItem>
                        </SelectContent>
                    </Select>
                     <div>
                        <Label className="font-semibold flex items-center">Tag handling <span className="ml-2 text-sm font-normal text-muted-foreground">relevant for Obsidian Graphs</span><InfoTooltip>Choose how to represent Google Keep tags in Obsidian.</InfoTooltip></Label>
                        <RadioGroup defaultValue="hash" className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
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
          <AccordionTrigger className="px-6 py-4 text-lg font-semibold bg-purple-500/10 hover:no-underline">
             <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                <span>Finish</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-4 pb-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="w-full">
                    <Eye className="mr-2 h-5 w-5" /> Preview
                </Button>
                <Button size="lg" variant="secondary" className="w-full">
                    <Settings className="mr-2 h-5 w-5" /> Run Conversion
                </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
