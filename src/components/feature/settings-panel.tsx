"use client";

import { useEffect, useState } from "react";
import { Settings, Server, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDescriptionContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HistoryDisplay } from "@/components/feature/history-display";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useKeepConnection } from "@/hooks/use-keep-connection";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { RunHistoryItem } from "@/components/feature/file-processing-area";
import { format } from "date-fns";

const statusLabels = {
  connected: "Live",
  connecting: "Connecting",
  error: "Error",
  disconnected: "Offline",
} as const;

const statusDots = {
  connected: "bg-emerald-500",
  connecting: "bg-amber-500",
  error: "bg-destructive",
  disconnected: "bg-muted-foreground/50",
} as const;

const syncIntervalOptions = [
  { value: "manual", label: "Manual only" },
  { value: "hourly", label: "Every hour" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
] as const;

function SettingsPanelContent({ open }: { open: boolean }) {
  const { status, disconnect } = useKeepConnection();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [syncInterval, setSyncInterval] = useState<string>("manual");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [latestRun, setLatestRun] = useState<RunHistoryItem | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !open) return;

    try {
      const savedHistory = localStorage.getItem(STORAGE_KEYS.history);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory) as RunHistoryItem[];
        setLatestRun(parsed[0] ?? null);
      } else {
        setLatestRun(null);
      }
    } catch {
      setLatestRun(null);
    }

    const savedInterval = localStorage.getItem(STORAGE_KEYS.keepSyncInterval);
    if (savedInterval) {
      setSyncInterval(savedInterval);
    }

    const savedLastSync = localStorage.getItem(STORAGE_KEYS.keepSyncLastSync);
    setLastSync(savedLastSync);
  }, [open]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.history && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as RunHistoryItem[];
          setLatestRun(parsed[0] ?? null);
        } catch {
          setLatestRun(null);
        }
      }
      if (event.key === STORAGE_KEYS.keepSyncInterval && event.newValue) {
        setSyncInterval(event.newValue);
      }
      if (event.key === STORAGE_KEYS.keepSyncLastSync) {
        setLastSync(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleOpenApiSetup = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("keep-sync-open-api-setup"));
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSyncIntervalChange = (value: string) => {
    setSyncInterval(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.keepSyncInterval, value);
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return format(date, "PPpp");
  };

  const lastSyncLabel = formatDate(lastSync) ?? "No sync yet.";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold">API Status</p>
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Server className="h-4 w-4" />
            <span className={cn("h-2 w-2 rounded-full", statusDots[status])} />
            <span className="font-medium">{statusLabels[status]}</span>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Disconnect
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-[425px]">
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Keep API?</AlertDialogTitle>
                <AlertDialogDescriptionContent>
                  This only disconnects the app. Stop the local service in your
                  terminal if it is still running.
                </AlertDialogDescriptionContent>
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
        </div>
        <Button variant="outline" onClick={handleOpenApiSetup}>
          Open API Setup
        </Button>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-sm font-semibold">Sync & History</p>
        <div className="space-y-3 rounded-md border bg-muted/30 p-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              Last export
            </p>
            <p className="text-sm font-medium">
              {latestRun ? format(new Date(latestRun.date), "PPpp") : "No exports yet."}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              Run hash
            </p>
            {latestRun ? (
              <p className="mt-1 break-all rounded-md bg-muted/60 px-2 py-1 font-mono text-[10px] text-foreground/80">
                {latestRun.hash}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Run hash appears after your first export.
              </p>
            )}
            {(latestRun?.namingOptions || latestRun?.formattingOptions) && (
              <p className="mt-1 text-xs text-muted-foreground">
                Settings snapshot saved for consistent exports.
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              Last sync
            </p>
            <p className="text-sm font-medium">{lastSyncLabel}</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Sync frequency</Label>
          <Select value={syncInterval} onValueChange={handleSyncIntervalChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a sync cadence" />
            </SelectTrigger>
            <SelectContent>
              {syncIntervalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Applies to the local bridge. Adjust anytime from Settings.
          </p>
        </div>
        <HistoryDisplay withDialog>
          <Button variant="outline" className="w-full">
            View conversion history
          </Button>
        </HistoryDisplay>
        <p className="text-xs text-muted-foreground">
          Run hashes and settings snapshots are stored locally in your browser.
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-sm font-semibold">Appearance</p>
        <Button variant="outline" onClick={toggleTheme} className="w-full">
          {mounted ? (
            theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span>
            {mounted
              ? theme === "dark"
                ? "Switch to Light"
                : "Switch to Dark"
              : "Toggle Theme"}
          </span>
        </Button>
      </div>
    </div>
  );
}

export function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open settings">
            <Settings className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your API connection, sync, and appearance.
            </DialogDescription>
          </DialogHeader>
          <SettingsPanelContent open={open} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open settings">
          <Settings className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
        <DrawerTitle>Settings</DrawerTitle>
        <DrawerDescription>
          Manage your API connection, sync, and appearance.
        </DrawerDescription>
      </DrawerHeader>
      <div className="px-4 pb-4">
        <SettingsPanelContent open={open} />
      </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
