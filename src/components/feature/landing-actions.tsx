"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useConversionFiles } from "@/components/feature/conversion-context";
import { cn } from "@/lib/utils";

export function LandingActions({
  align = "center",
  className,
}: {
  align?: "center" | "start";
  className?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setFiles } = useConversionFiles();

  useEffect(() => {
    const handleOpenFilePicker = () => {
      fileInputRef.current?.click();
    };

    window.addEventListener("keep-sync-open-file-picker", handleOpenFilePicker);
    return () => {
      window.removeEventListener(
        "keep-sync-open-file-picker",
        handleOpenFilePicker
      );
    };
  }, []);

  const handleOpenDialog = () => {
    window.dispatchEvent(new CustomEvent("keep-sync-open-api-setup"));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const ignoredFiles = [".DS_Store", "Thumbs.db"];
    const selectedFiles = Array.from(event.target.files).filter(
      (file) => !ignoredFiles.includes(file.name)
    );

    if (selectedFiles.length === 0) return;
    setFiles(selectedFiles);
    router.push("/convert");
  };

  const alignment =
    align === "start" ? "items-start text-left" : "items-center text-center";

  return (
    <div className={cn("flex flex-col gap-4", alignment, className)}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".html,.jpg,.jpeg,.png,.gif,.mp3,.wav,.ogg,.m4a"
        webkitdirectory=""
        onChange={handleFileChange}
      />
      <Button
        size="lg"
        onClick={handleOpenDialog}
        className="group relative h-12 overflow-hidden rounded-full border border-primary/50 bg-primary/90 px-8 text-base font-semibold text-primary-foreground shadow-[0_12px_40px_-18px_rgba(14,165,233,0.8)] transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
          <span className="absolute -left-10 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-white/20 blur-2xl" />
          <span className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/15 to-white/0" />
        </span>
        <span className="relative flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Convert
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </Button>
      <p className="text-sm text-muted-foreground">
        Choose a one-time export (recommended) or continuous sync via the local
        bridge.
      </p>
    </div>
  );
}
