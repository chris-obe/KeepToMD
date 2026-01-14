import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background font-body text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:32px_32px] opacity-30" />
      </div>

      <div className="container mx-auto flex max-w-3xl flex-col px-4 pb-16 pt-12 sm:px-8 sm:pb-20">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            KeepToMD
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective date: {new Date().getFullYear()}
          </p>
        </header>

        <section className="mt-8 space-y-6 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              Overview
            </h2>
            <p>
              These Terms govern your use of KeepToMD and the optional
              KeepToMD-bridge local utility. By using the software, you agree to
              these Terms.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              License
            </h2>
            <p>
              KeepToMD is licensed under the MIT License. This license governs
              your use, copying, modification, and distribution of the
              KeepToMD codebase. You must include the license notice in any
              copies or substantial portions of the software.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              Acceptable Use
            </h2>
            <p>
              You agree to use KeepToMD in compliance with applicable laws and
              Google&apos;s terms for your account. You are responsible for
              ensuring you have the rights to export and convert the content
              you process.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              Data Handling &amp; Privacy
            </h2>
            <p>
              KeepToMD processes files locally in your browser. No files are
              uploaded to a KeepToMD server. Settings and run history may be
              stored locally in your browser storage. You are responsible for
              safeguarding your device and exported files.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              Local API Bridge
            </h2>
            <p>
              Continuous sync requires the KeepToMD-bridge utility running on
              your machine. This utility accesses your Google account using an
              App Password (for accounts with 2-Step Verification). You are
              responsible for creating, protecting, and revoking App Passwords
              as needed. KeepToMD does not store or transmit your credentials.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              Third-Party Software
            </h2>
            <p>
              The KeepToMD-bridge utility uses{" "}
              <a
                href="https://github.com/kiwiz/gkeepapi"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline underline-offset-4"
              >
                gkeepapi
              </a>{" "}
              and relies on the{" "}
              <a
                href="https://github.com/simon-weber/gpsoauth#alternative-flow"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline underline-offset-4"
              >
                gpsoauth alternative flow
              </a>
              . These libraries are created and maintained by third parties and
              are subject to their own licenses. Review their licenses before
              use.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              No Affiliation
            </h2>
            <p>
              KeepToMD is an independent project and is not affiliated with,
              endorsed by, or sponsored by Google.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              No Warranty
            </h2>
            <p>
              The software is provided &quot;as is&quot; without warranty of any
              kind. Use is at your own risk.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Lightpilot and its
              contributors are not liable for any damages arising from your use
              of KeepToMD or the KeepToMD-bridge utility.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              Contributions
            </h2>
            <p>
              By submitting contributions, you agree to license your
              contributions under the MIT License.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              Changes to Terms
            </h2>
            <p>
              These Terms may be updated over time. Continued use of the
              software constitutes acceptance of the latest Terms.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              Contact
            </h2>
            <p>
              Questions? Open an issue on{" "}
              <a
                href="https://github.com/chris-obe/KeepToMD"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline underline-offset-4"
              >
                GitHub
              </a>
              .
            </p>
          </div>
        </section>

        <div className="mt-10">
          <Link href="/" className="text-sm font-semibold text-primary">
            &lt;- Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
