
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { History, Settings, Moon, Sun, FileText, Type, Server, Square } from 'lucide-react';
import { HistoryDisplay } from './history-display';
import { useTheme } from 'next-themes';
import { PresetManager } from './preset-manager';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
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
} from '@/components/ui/alert-dialog';
import { useKeepConnection } from '@/hooks/use-keep-connection';

export function PreferencesMenu({
  placement = 'floating',
  hidden = false,
  className,
}: {
  placement?: 'floating' | 'inline';
  hidden?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isApiHover, setIsApiHover] = useState(false);
  const [isDisconnectOpen, setDisconnectOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { status, disconnect } = useKeepConnection();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    return null;
  }

  if (hidden) {
    return null;
  }

  const statusLabel = {
    connected: 'Connected',
    connecting: 'Connecting',
    error: 'Connection error',
    disconnected: 'Disconnected',
  } as const;

  const statusDotClass = {
    connected: 'bg-emerald-500',
    connecting: 'bg-amber-500',
    error: 'bg-destructive',
    disconnected: 'bg-muted-foreground/50',
  } as const;

  const handleDisconnect = () => {
    disconnect();
    setDisconnectOpen(false);
  };

  return (
    <div
      className={cn(
        placement === 'floating' ? 'fixed bottom-6 right-6 z-50' : 'relative',
        className,
      )}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="relative flex flex-col items-center gap-3">
        {/* Expanded Menu Items */}
        <div
          className={`flex flex-col items-center gap-3 transition-all duration-300 ease-in-out ${
            isOpen
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-4 opacity-0'
          }`}
        >
          <HistoryDisplay tooltip="History" withDialog>
            <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full"
            >
              <History className="h-6 w-6" />
            </Button>
          </HistoryDisplay>

          <PresetManager type="naming" tooltip="File Name Presets">
            <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full"
            >
              <Type className="h-6 w-6" />
            </Button>
          </PresetManager>

          <PresetManager type="markdown" tooltip="Markdown Presets">
             <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full"
            >
              <FileText className="h-6 w-6" />
            </Button>
          </PresetManager>

          <HistoryDisplay tooltip={`Toggle ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
            <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </Button>
          </HistoryDisplay>

        </div>

        {/* Main Trigger Button */}
        <div className="relative flex flex-col items-center">
          <AlertDialog open={isDisconnectOpen} onOpenChange={setDisconnectOpen}>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "absolute -top-[68px] h-14 w-14 rounded-full shadow-lg transition-colors",
                        isApiHover
                          ? "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          : "hover:bg-accent"
                      )}
                      onMouseEnter={() => setIsApiHover(true)}
                      onMouseLeave={() => setIsApiHover(false)}
                      onFocus={() => setIsApiHover(true)}
                      onBlur={() => setIsApiHover(false)}
                      aria-label={`Keep API ${statusLabel[status]}`}
                    >
                      <span className="relative flex h-full w-full items-center justify-center">
                        {isApiHover ? (
                          <Square className="h-6 w-6" />
                        ) : (
                          <Server className="h-6 w-6" />
                        )}
                        <span
                          className={`absolute bottom-2 h-2 w-2 rounded-full ${statusDotClass[status]}`}
                        />
                      </span>
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="left" align="center">
                  <p>Keep API: {statusLabel[status]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <AlertDialogContent className="left-auto right-6 top-auto bottom-24 w-[320px] translate-x-0 translate-y-0">
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Keep API?</AlertDialogTitle>
                <AlertDialogDescription>
                  This only disconnects the app. Stop the local service in your
                  terminal if it is still running.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row justify-end gap-2">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <HistoryDisplay tooltip="Preferences" disabled={isOpen}>
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg"
            >
              <Settings
                className={`h-6 w-6 transition-transform duration-300 ${
                  isOpen ? 'rotate-90' : ''
                }`}
              />
            </Button>
          </HistoryDisplay>
        </div>
      </div>
    </div>
  );
}
