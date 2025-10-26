
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { History, Settings, Moon, Sun, FileText, Type } from 'lucide-react';
import { HistoryDisplay } from './history-display';
import { useTheme } from 'next-themes';
import { PresetManager } from './preset-manager';

export function PreferencesMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
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
          <HistoryDisplay tooltip="History">
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
  );
}
