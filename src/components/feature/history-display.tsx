
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
import { STORAGE_KEYS } from '@/lib/storage-keys';

export function HistoryDisplay({
  children,
  tooltip,
  disabled = false,
  withDialog = false,
}: {
  children: React.ReactNode;
  tooltip?: string;
  disabled?: boolean;
  withDialog?: boolean;
}) {
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);

  useEffect(() => {
    if (!withDialog || typeof window === 'undefined') return;
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEYS.history);
      if (savedHistory) {
        setRunHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
    }
  }, [withDialog]);
  
  // This effect listens for storage changes from other tabs/windows
  useEffect(() => {
    if (!withDialog || typeof window === 'undefined') return;
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.history && event.newValue) {
        setRunHistory(JSON.parse(event.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [withDialog]);

  const handleClearHistory = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.history);
      setRunHistory([]);
    }
  };

  const trigger = withDialog ? (
    <DialogTrigger asChild>
      {children}
    </DialogTrigger>
  ) : (
    children
  );

  const triggerWithTooltip = tooltip ? (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild disabled={disabled}>
          {trigger}
        </TooltipTrigger>
        <TooltipContent side="left" align="center">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    trigger
  );

  if (!withDialog) {
    return <>{triggerWithTooltip}</>;
  }

  return (
    <Dialog>
      {triggerWithTooltip}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Conversion History
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
          <p>Stored locally in your browser.</p>
        </div>
        <ScrollArea className="h-80 w-full pr-4">
          {runHistory.length > 0 ? (
            <div className="space-y-3 py-2">
              {runHistory.map((run) => (
                <div key={run.id} className="rounded-lg border bg-card/50 p-3">
                  <p className="text-sm font-semibold">
                    {format(new Date(run.date), 'PPpp')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {run.fileCount} file{run.fileCount === 1 ? '' : 's'} converted
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <p>No conversion history yet.</p>
            </div>
          )}
        </ScrollArea>
        <div className="flex justify-end pt-2">
          <Button
            variant="destructive"
            onClick={handleClearHistory}
            disabled={runHistory.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
