"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Check, Copy, Link2, PlugZap } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { useKeepConnection } from "@/hooks/use-keep-connection";

type SetupStep = "choice" | "api";

const KEEP_SERVICE_URL = "http://localhost:3717/health";
const KEEP_SERVICE_CLONE =
  "git clone https://github.com/chris-obe/KeepToMD.bridge.git";
const KEEP_SERVICE_INSTALL =
  "cd KeepToMD-bridge && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt";
const KEEP_SERVICE_RUN =
  "cd KeepToMD-bridge && source .venv/bin/activate && uvicorn app.main:app --host 127.0.0.1 --port 3717";

export function ApiSetupDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<SetupStep>("choice");
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const { setStatus } = useKeepConnection();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedChoice = localStorage.getItem(
      STORAGE_KEYS.keepApiSetupChoice
    );
    if (!storedChoice) {
      setOpen(true);
    }
  }, []);

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

  const handleChooseApi = () => {
    setStep("api");
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
      saveChoice("api");
      setOpen(false);
    } catch (error) {
      setStatus("error");
      setStatusMessage("No service detected at localhost:3717.");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleBack = () => {
    setStep("choice");
    setStatusMessage(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Choose your import method</DialogTitle>
          <DialogDescription>
            Connect a local Keep bridge (experimental) or upload a Google
            Takeout folder.
          </DialogDescription>
        </DialogHeader>

        {step === "choice" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              className="flex h-full flex-col gap-3 rounded-lg border p-4 text-left transition hover:border-primary"
              onClick={handleChooseApi}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <PlugZap className="h-4 w-4 text-primary" />
                Connect Keep API (experimental)
              </div>
              <p className="text-sm text-muted-foreground">
                Run a local bridge service, then connect directly from this app.
              </p>
            </button>
            <button
              type="button"
              className="flex h-full flex-col gap-3 rounded-lg border p-4 text-left transition hover:border-primary"
              onClick={handleChooseTakeout}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Link2 className="h-4 w-4 text-primary" />
                Upload Google Takeout
              </div>
              <p className="text-sm text-muted-foreground">
                Choose a Takeout folder and convert notes locally in the
                browser.
              </p>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  1. Clone the bridge repo
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    value={KEEP_SERVICE_CLONE}
                    readOnly
                    className="text-xs"
                  />
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
                  2. Install dependencies
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    value={KEEP_SERVICE_INSTALL}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleCopy(KEEP_SERVICE_INSTALL)}
                    aria-label="Copy install command"
                  >
                    {copySuccess === KEEP_SERVICE_INSTALL ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  3. Run the local service
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    value={KEEP_SERVICE_RUN}
                    readOnly
                    className="text-xs"
                  />
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

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">
                2. Detect local service
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
