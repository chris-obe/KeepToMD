"use client";

import { useEffect, useState } from 'react';
import { Notebook, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function StickyTopBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateVisibility = () => {
      setIsVisible(window.scrollY > 24);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateVisibility);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <div
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isVisible
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-3 opacity-0'
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 border-b bg-background/90 px-4 py-3 backdrop-blur sm:px-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Notebook className="h-4 w-4" />
            <span className="uppercase tracking-[0.25em]">KeepToMD</span>
          </div>
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={`Toggle ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              title={`Toggle ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
