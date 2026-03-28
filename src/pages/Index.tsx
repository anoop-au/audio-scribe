import { useState, useCallback } from "react";
import { Wand2, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import UploadZone from "@/components/UploadZone";
import ProcessingOptions from "@/components/ProcessingOptions";
import ProcessingScreen from "@/components/ProcessingScreen";
import ResultsScreen from "@/components/ResultsScreen";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import type { FileInfo, ProcessingOptions as Options, TranscriptionResult } from "@/lib/mock";
import type { JobResultResponse } from "@/types/aurascript";

type AppState = "upload" | "processing" | "results";

export default function Index() {
  const [state, setState] = useState<AppState>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [options, setOptions] = useState<Options>({
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
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <header className="text-center mb-10 relative">
          <div className="absolute right-0 top-0 flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
            <ThemeToggle />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-mono font-medium mb-4">
            <Wand2 className="w-3 h-3" />
            AI-Powered Transcription
          </div>
          <motion.h1
            className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-2 relative"
            initial={{ opacity: 0.5, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.span
              className="relative inline-block bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #ff6a00 0%, #ff2d92 50%, #1e90ff 100%)",
                textShadow: "0 0 20px rgba(255,106,0,0.6), 0 0 40px rgba(255,45,146,0.4), 0 0 80px rgba(0,212,255,0.2)",
                WebkitTextStroke: "0px",
              }}
              animate={{
                textShadow: [
                  "0 0 20px rgba(255,106,0,0.5), 0 0 40px rgba(255,45,146,0.3), 0 0 60px rgba(0,212,255,0.15)",
                  "0 0 28px rgba(255,106,0,0.7), 0 0 56px rgba(255,45,146,0.45), 0 0 80px rgba(0,212,255,0.25)",
                  "0 0 20px rgba(255,106,0,0.5), 0 0 40px rgba(255,45,146,0.3), 0 0 60px rgba(0,212,255,0.15)",
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              Aurascript
              {/* Outer aura glow layer */}
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(255,106,0,0.3) 0%, rgba(255,45,146,0.18) 35%, rgba(30,144,255,0.1) 60%, transparent 80%)",
                  filter: "blur(70px)",
                  transform: "scale(2.2, 3)",
                }}
              />
            </motion.span>
          </motion.h1>
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
                {/* Large central upload tile */}
                <div className="glassmorphism-card rounded-2xl p-5">
                  <UploadZone
                    onFileSelect={handleFileSelect}
                    selectedFile={fileInfo}
                    onClear={handleClear}
                  />
                </div>

                {/* Settings tiles side-by-side */}
                <ProcessingOptions options={options} onChange={setOptions} />

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
        <footer className="text-center mt-10 space-y-1">
          <p className="text-[11px] text-muted-foreground/50 font-mono tracking-wide">
            Your files are processed securely and never stored
          </p>
          <p className="text-[9px] text-muted-foreground/30 tracking-[0.2em] uppercase">
            With love from Anoop
          </p>
        </footer>
      </div>
    </div>
  );
}
