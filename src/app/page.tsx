import Image from "next/image";
import { LandingActions } from "@/components/feature/landing-actions";
import {
  ArrowUpRight,
  Folder,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background font-body text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:32px_32px] opacity-40" />
        <div className="absolute -top-24 right-[-10%] h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] h-96 w-96 rounded-full bg-primary/15 blur-[140px]" />
      </div>

      <div className="container mx-auto flex max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-2xl bg-card/70 p-2 shadow-sm">
              <Image
                src="/brand/keeptmd-logo.png"
                alt="KeepToMD logo"
                fill
                sizes="48px"
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                KeepToMD
              </p>
              <p className="text-xs text-muted-foreground">
                Google Keep exports, Obsidian-ready.
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="rounded-full border px-3 py-1">Local-first</span>
            <span className="rounded-full border px-3 py-1">No signup</span>
            <span className="rounded-full border px-3 py-1">Private</span>
          </div>
        </nav>

        <section className="mt-12 grid items-start gap-10 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Local-first conversion
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Turn{" "}
                <span className="font-headline italic text-primary">Keep</span>
                {" "}
                into{" "}
                <span className="font-headline italic text-foreground">
                  Markdown
                </span>
                {" "}
                with a clean, vault-ready export.
              </h1>
              <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                KeepToMD turns your Google Keep notes into structured Markdown
                that drops straight into Obsidian. Everything runs locally, so
                your notes stay on your machine.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <span className="rounded-full border bg-card/60 px-3 py-1">
                One-time export
              </span>
              <span className="rounded-full border bg-card/60 px-3 py-1">
                Continuous sync
              </span>
              <span className="rounded-full border bg-card/60 px-3 py-1">
                No cloud uploads
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border bg-card/70 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                  <Folder className="h-4 w-4 text-primary" />
                  Final export
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Best for a platform switch. Upload a Takeout folder and export
                  a single, tidy zip.
                </p>
              </div>
              <div className="rounded-2xl border bg-card/70 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  Continuous sync
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Keep a local bridge running to sync new notes over time.
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border bg-card/80 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.6)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                <Wand2 className="h-4 w-4 text-primary" />
                Start here
              </div>
              <h2 className="mt-3 font-headline text-2xl">
                Choose your import path
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The recommended path is a one-time export. Continuous sync is
                available for advanced setups.
              </p>
              <LandingActions align="start" className="mt-6" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border bg-card/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Privacy by design
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Everything stays on your device. No logins, no uploads.
                </p>
              </div>
              <div className="rounded-2xl border bg-card/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Consistent output
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Hashes and settings snapshots help keep exports aligned over
                  time.
                </p>
              </div>
              <div className="rounded-2xl border bg-card/60 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                  Obsidian-ready
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Clean file names, markdown presets, and assets packaged to
                  drop in.
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border bg-card/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Step 1
            </p>
            <p className="mt-3 text-lg font-semibold">Choose your source</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick a Takeout folder for a one-time export, or connect the local
              bridge for ongoing sync.
            </p>
          </div>
          <div className="rounded-2xl border bg-card/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Step 2
            </p>
            <p className="mt-3 text-lg font-semibold">Tune your output</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Preview naming rules, presets, and formatting before you export.
            </p>
          </div>
          <div className="rounded-2xl border bg-card/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Step 3
            </p>
            <p className="mt-3 text-lg font-semibold">Drop into Obsidian</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Download the zip and place it directly into your vault.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
