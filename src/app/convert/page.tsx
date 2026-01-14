import { AppHeader } from "@/components/feature/app-header";
import { FileProcessingArea } from "@/components/feature/file-processing-area";

export default function ConvertPage() {
  return (
    <main className="min-h-screen w-full bg-background font-body text-foreground">
      <AppHeader />
      <div className="container mx-auto flex max-w-6xl flex-col items-center px-4 py-8 sm:px-8 sm:py-12">
        <FileProcessingArea />
      </div>
    </main>
  );
}
