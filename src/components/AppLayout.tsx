
import { useState } from "react";
import { Button } from "@/components/ui/button";
import FileUpload from "./FileUpload";
import JobRequirements from "./JobRequirements";
import ResumeResults from "./ResumeResults";

export default function AppLayout() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFilesProcessed = (files: File[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <CirclePercent className="h-6 w-6 mr-2" />
            <h1 className="text-xl font-bold text-gradient">ResumeMatcher</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <section className="p-6 bg-card rounded-lg border border-border">
              <FileUpload onFilesProcessed={handleFilesProcessed} />
            </section>
            
            <section className="p-6 bg-card rounded-lg border border-border">
              <JobRequirements />
            </section>
          </div>
          
          <div>
            <section className="p-6 bg-card rounded-lg border border-border">
              <ResumeResults />
            </section>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          ResumeMatcher © {new Date().getFullYear()} | AI-powered resume matching application
        </div>
      </footer>
    </div>
  );
}

import { CirclePercent } from "lucide-react";
