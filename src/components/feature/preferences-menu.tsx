
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { History, Settings, Moon, Sun, FileText, Type } from 'lucide-react';
import { HistoryDisplay } from './history-display';
import { useTheme } from 'next-themes';
import { PresetManager } from './preset-manager';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function PreferencesMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMainTooltipOpen, setIsMainTooltipOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Hide main tooltip if menu is open
    if (isOpen) {
      setIsMainTooltipOpen(false);
    }
  }, [isOpen]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50"
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
          {/* History Button */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <HistoryDisplay>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                  >
                    <History className="h-6 w-6" />
                  </Button>
                </HistoryDisplay>
              </TooltipTrigger>
              <TooltipContent side="left" align="center">
                <p>History</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Naming Presets Button */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PresetManager type="naming">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                  >
                    <Type className="h-6 w-6" />
                  </Button>
                </PresetManager>
              </TooltipTrigger>
              <TooltipContent side="left" align="center">
                <p>File Name Presets</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Markdown Presets Button */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PresetManager type="markdown">
                   <Button
                    variant="secondary"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                  >
                    <FileText className="h-6 w-6" />
                  </Button>
                </PresetManager>
              </TooltipTrigger>
              <TooltipContent side="left" align="center">
                <p>Markdown Presets</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Theme Toggle Button */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" align="center">
                <p>Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Main Trigger Button */}
        <div>
          <TooltipProvider delayDuration={0}>
            <Tooltip open={isMainTooltipOpen && !isOpen} onOpenChange={setIsMainTooltipOpen}>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent side="left" align="center">
                <p>Preferences</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
