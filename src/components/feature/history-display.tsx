
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, ShieldCheck, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { RunHistoryItem } from './file-processing-area';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

export function HistoryDisplay() {
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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
  
  // This effect listens for storage changes from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'keepSyncHistory' && event.newValue) {
        setRunHistory(JSON.parse(event.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleClearHistory = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('keepSyncHistory');
      setRunHistory([]);
    }
  };
  
  if (!isClient) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg">
          <History className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Run History
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleClearHistory} disabled={runHistory.length === 0}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clear all history</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-2 rounded-lg bg-background/50 p-3 text-sm text-muted-foreground border">
          <ShieldCheck className="h-5 w-5 shrink-0 text-accent" />
          <p>Run history is stored locally in your browser. Clearing your browser data will permanently remove this history.</p>
        </div>
        <ScrollArea className="h-96 w-full">
          <div className="space-y-4 pr-4">
            {runHistory.length > 0 ? (
              runHistory.map((run) => (
                <div key={run.id} className="p-3 rounded-lg border bg-card/50">
                  <p className="font-semibold">{format(new Date(run.date), 'PPP p')}</p>
                  <p className="text-sm text-muted-foreground">{run.fileCount} files processed</p>
                  <p className="text-xs text-muted-foreground/80 mt-2 break-all">
                    Hash: <span className="font-mono">{run.hash.substring(0, 24)}...</span>
                  </p>
                </div>
              ))
            ) : (
              <div className="flex h-64 items-center justify-center text-center text-muted-foreground">
                <p>No conversion runs have been recorded yet.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
