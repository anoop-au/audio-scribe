import { useState, useCallback } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadZone from "@/components/UploadZone";
import ProcessingOptions from "@/components/ProcessingOptions";
import ProcessingScreen from "@/components/ProcessingScreen";
import ResultsScreen from "@/components/ResultsScreen";
import type { FileInfo, ProcessingOptions as Options, TranscriptionResult } from "@/lib/mock";

type AppState = "upload" | "processing" | "results";

export default function Index() {
  const [state, setState] = useState<AppState>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [options, setOptions] = useState<Options>({
    translateToEnglish: false,
    outputFormat: "transcript",
    languageHint: "",
  });
  const [result, setResult] = useState<TranscriptionResult | null>(null);

  const handleFileSelect = useCallback((_file: File, info: FileInfo) => {
    setFile(_file);
    setFileInfo(info);
  }, []);

  const handleClear = useCallback(() => {
    setFile(null);
    setFileInfo(null);
  }, []);

  const handleStart = () => {
    if (!fileInfo) return;
    setState("processing");
  };

  const handleComplete = (r: TranscriptionResult) => {
    setResult(r);
    setState("results");
  };

  const handleReset = () => {
    setState("upload");
    setFile(null);
    setFileInfo(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4">
            <Wand2 className="w-3 h-3" />
            AI-Powered Transcription
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Transcribe anything,{" "}
            <span className="text-gradient bg-gradient-to-r from-accent to-accent/60">instantly</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Upload audio or video and get accurate transcripts in seconds. Supports 50+ languages.
          </p>
        </header>

        {/* Content */}
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          {state === "upload" && (
            <div className="space-y-6">
              <UploadZone
                onFileSelect={handleFileSelect}
                selectedFile={fileInfo}
                onClear={handleClear}
              />

              {fileInfo && (
                <>
                  <div className="border-t border-border pt-6">
                    <ProcessingOptions options={options} onChange={setOptions} />
                  </div>
                  <Button
                    onClick={handleStart}
                    className="w-full h-12 text-base bg-accent text-accent-foreground hover:bg-accent/90 animate-fade-up"
                    style={{ animationDelay: "0.2s" }}
                  >
                    Start Transcription
                  </Button>
                </>
              )}
            </div>
          )}

          {state === "processing" && fileInfo && (
            <ProcessingScreen
              fileInfo={fileInfo}
              onComplete={handleComplete}
              onCancel={handleReset}
            />
          )}

          {state === "results" && result && (
            <ResultsScreen result={result} onReset={handleReset} />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 mt-8">
          Your files are processed securely and never stored
        </p>
      </div>
    </div>
  );
}
