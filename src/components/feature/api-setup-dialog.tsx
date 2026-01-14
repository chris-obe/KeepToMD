"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Folder,
  Link2,
  PlugZap,
  RefreshCw,
} from "lucide-react";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { useKeepConnection } from "@/hooks/use-keep-connection";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SetupStep =
  | "choice"
  | "confirm"
  | "appPassword"
  | "bridge"
  | "login"
  | "success";

type ApiSetupDialogProps = {
  autoOpen?: boolean;
};

const KEEP_SERVICE_URL = "http://localhost:3717/health";
const KEEP_SERVICE_NOTES_URL = "http://localhost:3717/notes";
const KEEP_SERVICE_DIR =
  "export BRIDGE_DIR=\"$HOME/GoogleKeepToMarkdown/KeepToMD-bridge\"";
const KEEP_SERVICE_CLONE =
  "git clone https://github.com/chris-obe/KeepToMD.bridge.git \"$BRIDGE_DIR\"";
const KEEP_SERVICE_SETUP = "cd \"$BRIDGE_DIR\" && ./setup.sh";
const KEEP_SERVICE_RUN = "cd \"$BRIDGE_DIR\" && ./setup.sh --run";

const syncIntervalOptions = [
  { value: "manual", label: "Manual only" },
  { value: "hourly", label: "Every hour" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
] as const;

const setupSteps = [
  { id: "appPassword", label: "App Password" },
  { id: "bridge", label: "Local Bridge" },
  { id: "login", label: "Sign In" },
] as const;

export function ApiSetupDialog({ autoOpen = false }: ApiSetupDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<SetupStep>("choice");
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [confirmAcknowledged, setConfirmAcknowledged] = useState(false);
  const [syncInterval, setSyncInterval] = useState<string>("manual");
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "complete" | "error"
  >("idle");
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const progressTimer = useRef<number | null>(null);
  const { setStatus } = useKeepConnection();
  const { toast } = useToast();

  const activeStepIndex = useMemo(() => {
    if (step === "appPassword") return 0;
    if (step === "bridge") return 1;
    return 2;
  }, [step]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedInterval = localStorage.getItem(STORAGE_KEYS.keepSyncInterval);
    if (storedInterval) {
      setSyncInterval(storedInterval);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (open) {
      window.dispatchEvent(new CustomEvent("keep-sync-api-setup-open"));
    } else {
      window.dispatchEvent(new CustomEvent("keep-sync-api-setup-close"));
    }
    if (typeof document !== "undefined") {
      document.body.dataset.keepApiSetupOpen = open ? "true" : "false";
    }
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!autoOpen) return;
    const storedChoice = localStorage.getItem(
      STORAGE_KEYS.keepApiSetupChoice
    );
    if (!storedChoice) {
      setStep("choice");
      setOpen(true);
    }
  }, [autoOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOpenSetup = () => {
      resetDialogState();
      setStep("choice");
      setOpen(true);
    };

    window.addEventListener("keep-sync-open-api-setup", handleOpenSetup);
    return () => {
      window.removeEventListener("keep-sync-open-api-setup", handleOpenSetup);
    };
  }, []);

  const resetDialogState = () => {
    if (typeof window !== "undefined" && progressTimer.current) {
      window.clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    setStep("choice");
    setCopySuccess(null);
    setStatusMessage(null);
    setLoginError(null);
    setIsDetecting(false);
    setIsLoggingIn(false);
    setLoginEmail("");
    setLoginPassword("");
    setConfirmAcknowledged(false);
    setSyncStatus("idle");
    setSyncProgress(0);
    setSyncMessage(null);
    setSyncError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetDialogState();
    }
  };

  const saveChoice = (choice: "api" | "takeout") => {
    localStorage.setItem(STORAGE_KEYS.keepApiSetupChoice, choice);
  };

  const handleChooseTakeout = () => {
    saveChoice("takeout");
    setOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("keep-sync-open-file-picker"));
    }
  };

  const handleChooseContinuous = () => {
    const isDesktop =
      typeof window === "undefined"
        ? true
        : window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop) {
      toast({
        variant: "destructive",
        title: "Desktop only",
        description: "Continuous sync setup is only available on desktop.",
      });
      return;
    }
    setStep("confirm");
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopySuccess(value);
      setTimeout(() => setCopySuccess(null), 1200);
    } catch (error) {
      setCopySuccess(null);
    }
  };

  const handleDetect = async () => {
    setStatusMessage(null);
    setIsDetecting(true);
    setStatus("connecting");

    try {
      const response = await fetch(KEEP_SERVICE_URL, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Service not ready.");
      }

      setStatus("connected");
      setStep("login");
    } catch (error) {
      setStatus("error");
      setStatusMessage("No service detected at localhost:3717.");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleBack = () => {
    setStatusMessage(null);
    setLoginError(null);
    if (step === "login") {
      setStep("bridge");
      return;
    }
    if (step === "bridge") {
      setStep("appPassword");
      return;
    }
    if (step === "appPassword" || step === "confirm") {
      setStep("choice");
      return;
    }
    if (step === "success") {
      setStep("login");
      return;
    }
    setStep("choice");
  };

  const handleLogin = async () => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const response = await fetch("http://localhost:3717/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (!response.ok) {
        throw new Error("Login failed.");
      }

      setStatus("connected");
      saveChoice("api");
      setLoginPassword("");
      setStep("success");
    } catch (error) {
      setLoginError("Login failed. Check your credentials and try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSyncIntervalChange = (value: string) => {
    setSyncInterval(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.keepSyncInterval, value);
    }
  };

  const handleSyncNow = async () => {
    if (syncStatus === "syncing") return;

    setSyncStatus("syncing");
    setSyncError(null);
    setSyncMessage(null);
    setSyncProgress(12);

    if (typeof window !== "undefined") {
      if (progressTimer.current) {
        window.clearInterval(progressTimer.current);
      }
      progressTimer.current = window.setInterval(() => {
        setSyncProgress((prev) => Math.min(prev + 8, 85));
      }, 350);
    }

    try {
      const response = await fetch(KEEP_SERVICE_NOTES_URL, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Sync failed.");
      }

      const data = await response.json().catch(() => null);
      if (progressTimer.current) {
        window.clearInterval(progressTimer.current);
        progressTimer.current = null;
      }

      setSyncProgress(100);
      setSyncStatus("complete");
      if (Array.isArray(data)) {
        setSyncMessage(`Synced ${data.length} notes.`);
      } else {
        setSyncMessage("Sync complete. Ready to convert.");
      }
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.keepSyncLastSync, now);
    } catch (error) {
      if (progressTimer.current) {
        window.clearInterval(progressTimer.current);
        progressTimer.current = null;
      }
      setSyncProgress(0);
      setSyncStatus("error");
      setSyncError("Sync failed. Make sure the bridge is running.");
    }
  };

  const dialogTitle =
    step === "choice"
      ? "Choose your import path"
      : step === "confirm"
        ? "Confirm continuous sync"
        : "Set up continuous sync";
  const dialogDescription =
    step === "choice"
      ? "One-time export is best for switching platforms or doing a final batch export."
      : step === "confirm"
        ? "Continuous sync is a multi-step setup that uses a local helper with direct access to your Google account."
        : "Follow these steps to connect the local bridge.";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        {step === "choice" ? (
          <div className="space-y-4">
            <button
              type="button"
              className="group flex w-full flex-col gap-3 rounded-xl border bg-muted/20 p-4 text-left transition hover:border-primary/60 hover:bg-muted/30"
              onClick={handleChooseTakeout}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Folder className="h-4 w-4 text-primary" />
                  One-time export (recommended)
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Best for a final export or platform switch. Upload a Google
                Takeout folder and convert locally.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <span className="rounded-full border px-2 py-0.5">No setup</span>
                <span className="rounded-full border px-2 py-0.5">
                  Runs locally
                </span>
                <span className="rounded-full border px-2 py-0.5">
                  Batch export
                </span>
              </div>
            </button>

            <button
              type="button"
              className="group flex w-full flex-col gap-3 rounded-xl border p-4 text-left transition hover:border-primary/60 hover:bg-muted/30"
              onClick={handleChooseContinuous}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <PlugZap className="h-4 w-4 text-primary" />
                  Continuous sync (local bridge)
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Advanced
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Requires a local helper that stays running and an App Password
                with direct access to your Google account.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <span className="rounded-full border px-2 py-0.5">
                  Always on
                </span>
                <span className="rounded-full border px-2 py-0.5">
                  App Password
                </span>
                <span className="rounded-full border px-2 py-0.5">
                  Continuous sync
                </span>
              </div>
            </button>
            <p className="text-xs text-muted-foreground">
              You can switch paths later in Settings.
            </p>
          </div>
        ) : step === "confirm" ? (
          <div className="space-y-4">
            <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Continuous sync is advanced
              </div>
              <p className="text-sm text-muted-foreground">
                This is a multi-step setup that keeps a local helper running on
                your machine.
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Requires a local utility that stays running on your machine.</li>
                <li>
                  Uses a Google App Password with direct access to your account.
                </li>
                <li>Best for ongoing sync, not a one-time export.</li>
              </ul>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sync-confirm"
                  checked={confirmAcknowledged}
                  onCheckedChange={(checked) =>
                    setConfirmAcknowledged(Boolean(checked))
                  }
                />
                <label
                  htmlFor="sync-confirm"
                  className="text-sm text-muted-foreground"
                >
                  I understand and want to continue.
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                onClick={() => setStep("appPassword")}
                disabled={!confirmAcknowledged}
              >
                Continue setup
              </Button>
            </div>
          </div>
        ) : step === "appPassword" ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Step 1: Create an App Password</p>
                <p className="text-sm text-muted-foreground">
                  The local bridge needs a Google App Password to connect. Use
                  your regular email, but an App Password instead of your normal
                  password.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" asChild>
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Open App Passwords
                  </a>
                </Button>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>- Name it "KeepToMD" so you can find it later.</li>
                <li>
                  - Copy the 16-character password. Remove spaces if they
                  appear.
                </li>
                <li>- You will paste it in the sign-in step.</li>
              </ul>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={() => setStep("bridge")}>Continue</Button>
            </div>
            <StepIndicator activeIndex={activeStepIndex} />
          </div>
        ) : step === "login" ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Step 3: Sign in to Google Keep
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use your Google email and the App Password you generated (not
                  your regular password).
                </p>
              </div>
              <div className="space-y-3">
                <Input
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Email"
                />
                <Input
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="App password"
                  type="password"
                />
                {loginError && (
                  <p className="text-xs text-destructive">{loginError}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleLogin}
                  disabled={isLoggingIn || !loginEmail || !loginPassword}
                  className="w-full"
                >
                  {isLoggingIn ? "Signing in..." : "Sign in to Keep"}
                </Button>
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              </div>
            </div>
            <StepIndicator activeIndex={activeStepIndex} />
          </div>
        ) : step === "bridge" ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Step 2: Install and run the local bridge
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Keep this terminal window running for continuous sync.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  1. Set the install folder
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Input value={KEEP_SERVICE_DIR} readOnly className="text-xs" />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleCopy(KEEP_SERVICE_DIR)}
                    aria-label="Copy install folder command"
                  >
                    {copySuccess === KEEP_SERVICE_DIR ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Adjust the path if you want a different location.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  2. Clone the bridge repo
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Input value={KEEP_SERVICE_CLONE} readOnly className="text-xs" />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleCopy(KEEP_SERVICE_CLONE)}
                    aria-label="Copy clone command"
                  >
                    {copySuccess === KEEP_SERVICE_CLONE ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  3. Run the setup script
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Input value={KEEP_SERVICE_SETUP} readOnly className="text-xs" />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleCopy(KEEP_SERVICE_SETUP)}
                    aria-label="Copy setup command"
                  >
                    {copySuccess === KEEP_SERVICE_SETUP ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  4. Run the local service (or use --run)
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Input value={KEEP_SERVICE_RUN} readOnly className="text-xs" />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleCopy(KEEP_SERVICE_RUN)}
                    aria-label="Copy run command"
                  >
                    {copySuccess === KEEP_SERVICE_RUN ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">
                Detect local service
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                The app checks {KEEP_SERVICE_URL}.
              </p>
              {statusMessage && (
                <p className="mt-2 text-xs text-destructive">{statusMessage}</p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  onClick={handleDetect}
                  disabled={isDetecting}
                  className="w-full"
                >
                  {isDetecting ? "Detecting..." : "Detect Local Keep Service"}
                </Button>
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              </div>
            </div>
            <StepIndicator activeIndex={activeStepIndex} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Connected to the local bridge
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Your Keep bridge is live. You can sync now or jump straight to
                converting notes.
              </p>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Sync now</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncNow}
                  disabled={syncStatus === "syncing"}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {syncStatus === "syncing" ? "Syncing" : "Sync Keep"}
                </Button>
              </div>
              {syncStatus === "syncing" && (
                <div className="space-y-2">
                  <Progress value={syncProgress} />
                  <p className="text-xs text-muted-foreground">
                    Syncing Keep via the local bridge.
                  </p>
                </div>
              )}
              {syncStatus === "complete" && (
                <p className="text-xs text-muted-foreground">
                  {syncMessage ?? "Sync complete. Ready to convert."}
                </p>
              )}
              {syncStatus === "error" && (
                <p className="text-xs text-destructive">{syncError}</p>
              )}
            </div>

            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Sync frequency
              </p>
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
                You can adjust this later in Settings &gt; Sync &amp; History.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={() => setOpen(false)}>Close setup</Button>
            </div>
            <StepIndicator activeIndex={activeStepIndex} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StepIndicator({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-2 sm:hidden">
        {setupSteps.map((step, index) => (
          <span
            key={step.id}
            className={cn(
              "h-2 w-2 rounded-full",
              index <= activeIndex ? "bg-primary" : "bg-muted-foreground/40"
            )}
          />
        ))}
      </div>
      <div className="hidden items-center justify-between gap-4 sm:flex">
        {setupSteps.map((step, index) => (
          <div key={step.id} className="flex flex-1 items-center gap-3">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                index <= activeIndex ? "bg-primary" : "bg-muted-foreground/40"
              )}
            />
            <span
              className={cn(
                "text-xs font-semibold",
                index <= activeIndex ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
            {index < setupSteps.length - 1 && (
              <span className="h-px flex-1 bg-border" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
