import { useState, useCallback } from "react";
import { Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import UploadZone from "@/components/UploadZone";
import ProcessingOptions from "@/components/ProcessingOptions";
import ProcessingScreen from "@/components/ProcessingScreen";
import ResultsScreen from "@/components/ResultsScreen";
import ThemeToggle from "@/components/ThemeToggle";
import type { FileInfo, ProcessingOptions as Options, TranscriptionResult } from "@/lib/mock";
import type { JobResultResponse } from "@/types/aurascript";

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
  const [jobResult, setJobResult] = useState<JobResultResponse | null>(null);

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

  const handleComplete = (r: TranscriptionResult, rawJobResult?: JobResultResponse) => {
    setResult(r);
    if (rawJobResult) setJobResult(rawJobResult);
    setState("results");
  };

  const handleReset = () => {
    setState("upload");
    setFile(null);
    setFileInfo(null);
    setResult(null);
    setJobResult(null);
  };

  return (
    <div className="min-h-screen gradient-bg grid-pattern">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <header className="text-center mb-10 relative">
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-mono font-medium mb-4">
            <Wand2 className="w-3 h-3" />
            AI-Powered Transcription
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-2">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #ff6a00 0%, #ff2d92 50%, #00d4ff 100%)",
                filter: "drop-shadow(0 0 12px rgba(255,106,0,0.3))",
              }}
            >Aurascript</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Upload audio or video and get accurate transcripts in seconds. Supports 50+ languages.
          </p>
        </header>

        {/* Content */}
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {state === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <UploadZone
                  onFileSelect={handleFileSelect}
                  selectedFile={fileInfo}
                  onClear={handleClear}
                />

                <div className="glassmorphism-card rounded-2xl px-5 py-5">
                  <ProcessingOptions options={options} onChange={setOptions} />
                </div>

                {fileInfo && (
                  <Button
                    onClick={handleStart}
                    className="w-full h-12 text-base font-bold text-white hover:brightness-110 active:scale-[0.98] transition-all duration-200 animate-fade-up border-0"
                    style={{
                      background: 'linear-gradient(135deg, #ff6a00 0%, #ff2d92 100%)',
                      boxShadow: '0 4px 16px rgba(255, 106, 0, 0.3)',
                      animationDelay: '0.1s',
                    }}
                  >
                    Start Transcription
                  </Button>
                )}
              </motion.div>
            )}

            {state === "processing" && fileInfo && file && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <ProcessingScreen
                  file={file}
                  fileInfo={fileInfo}
                  options={options}
                  onComplete={handleComplete}
                  onCancel={handleReset}
                />
              </motion.div>
            )}

            {state === "results" && result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ResultsScreen result={result} jobResult={jobResult} onReset={handleReset} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 mt-8 font-mono">
          Your files are processed securely and never stored
        </p>
        <p className="text-center text-xs text-muted-foreground/40 mt-2 italic">
          With love from Anoop
        </p>
      </div>
    </div>
  );
}
