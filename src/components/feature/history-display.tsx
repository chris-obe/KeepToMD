
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

export function HistoryDisplay({
  children,
  tooltip,
  disabled = false,
}: {
  children: React.ReactNode;
  tooltip?: string;
  disabled?: boolean;
}) {
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

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

  const trigger = (
    <DialogTrigger asChild>
      {children}
    </DialogTrigger>
  );

  // If there's no tooltip, just render the dialog with its trigger
  if (!tooltip) {
    return (
      <Dialog>
        {trigger}
        <DialogContent className="max-w-md">
          {/* Dialog Content */}
        </DialogContent>
      </Dialog>
    );
  }

  // If there is a tooltip, wrap the trigger with it
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild disabled={disabled}>
           {children}
        </TooltipTrigger>
        <TooltipContent side="left" align="center">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
