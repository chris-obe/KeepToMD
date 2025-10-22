
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { History, Settings, Moon, Sun, Library, Type } from 'lucide-react';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const menuItems = [
    {
      label: 'History',
      icon: History,
      action: 'history',
    },
    {
      label: 'Naming Presets',
      icon: Library,
      action: 'namingPresets',
      type: 'naming' as const,
    },
    {
        label: 'Markdown Presets',
        icon: Type,
        action: 'markdownPresets',
        type: 'markdown' as const,
    },
    {
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      icon: theme === 'dark' ? Sun : Moon,
      action: toggleTheme,
    },
  ];

  const renderMenuItem = (item: (typeof menuItems)[0]) => {
    // Prevent rendering the theme toggle icon on the server to avoid hydration mismatch
    if (!mounted && (item.icon === Sun || item.icon === Moon)) {
      return null;
    }

    const button = (
      <Button
        variant="secondary"
        size="icon"
        className="h-12 w-12 rounded-full"
        onClick={typeof item.action === 'function' ? item.action : undefined}
      >
        <item.icon className="h-6 w-6" />
      </Button>
    );

    let content = button;

    if (item.action === 'history') {
      content = <HistoryDisplay>{button}</HistoryDisplay>;
    } else if (item.action === 'namingPresets' || item.action === 'markdownPresets') {
      content = <PresetManager type={item.type}>{button}</PresetManager>;
    }

    return (
      <TooltipProvider key={item.label}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="left" align="center">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

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
          {menuItems.map(renderMenuItem)}
        </div>

        {/* Main Trigger Button */}
        <TooltipProvider>
          <Tooltip open={isOpen ? false : undefined}>
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
  );
}

    