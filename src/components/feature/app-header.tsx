"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Server, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { useKeepConnection } from "@/hooks/use-keep-connection";
import { useTheme } from "next-themes";
import { SettingsPanel } from "@/components/feature/settings-panel";
import { cn } from "@/lib/utils";

const statusLabel = {
  connected: "Live",
  connecting: "Connecting",
  error: "Error",
  disconnected: "Offline",
} as const;

const statusDotClass = {
  connected: "bg-emerald-500",
  connecting: "bg-amber-500",
  error: "bg-destructive",
  disconnected: "bg-muted-foreground/50",
} as const;

export function AppHeader() {
  const { status, disconnect } = useKeepConnection();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
        >
          <span className="relative h-7 w-7">
            <Image
              src="/brand/keeptmd-logo.svg"
              alt="KeepToMD logo"
              fill
              sizes="28px"
              className="object-contain"
              unoptimized
            />
          </span>
          <span className="uppercase tracking-[0.25em]">KeepToMD</span>
        </Link>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2" aria-label="API status">
                <Server className="h-4 w-4" />
                <span
                  className={cn("h-2 w-2 rounded-full", statusDotClass[status])}
                />
                <span className="text-xs font-semibold">
                  {statusLabel[status]}
                </span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-[425px]">
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
                  onClick={disconnect}
                >
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={
              mounted
                ? `Toggle ${theme === "dark" ? "Light" : "Dark"} Mode`
                : "Toggle Theme"
            }
            title={
              mounted
                ? `Toggle ${theme === "dark" ? "Light" : "Dark"} Mode`
                : "Toggle Theme"
            }
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <SettingsPanel />
        </div>
      </div>
    </header>
  );
}
