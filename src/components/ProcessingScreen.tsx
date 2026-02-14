import { useEffect, useState, useRef } from "react";
import { Check, Loader2, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { createInitialSteps, MOCK_TRANSCRIPT, type ProcessingStep, type TranscriptionResult, type FileInfo } from "@/lib/mock";

interface ProcessingScreenProps {
  fileInfo: FileInfo;
  onComplete: (result: TranscriptionResult) => void;
  onCancel: () => void;
}

const STEP_LABELS: Record<string, string> = {
  analyze: "Analyze",
  chunk: "Chunk",
  transcribe: "Transcribe",
  merge: "Merge",
  format: "Format",
};

export default function ProcessingScreen({ fileInfo, onComplete, onCancel }: ProcessingScreenProps) {
  const chunkCount = Math.max(5, Math.min(10, Math.round(fileInfo.size / (1024 * 512))));
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>(createInitialSteps(chunkCount));
  const [statusText, setStatusText] = useState("Analyzing file...");
  const [elapsed, setElapsed] = useState(0);
  const [chunksCompleted, setChunksCompleted] = useState(0);
  const [chunkStatuses, setChunkStatuses] = useState<Array<"pending" | "active" | "done">>(
    Array(chunkCount).fill("pending")
  );
  const [recentlyCompleted, setRecentlyCompleted] = useState<number | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    cancelled.current = false;
    const run = async () => {
      const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

      // Step 1: Analyze
      updateStep("analyze", "active");
      setStatusText("Analyzing file...");
      await delay(1200);
      if (cancelled.current) return;
      setProgress(8);
      updateStep("analyze", "done", "0.8s");

      // Step 2: Chunk
      updateStep("chunk", "active");
      setStatusText(`Creating ${chunkCount} chunks...`);
      await delay(1000);
      if (cancelled.current) return;
      setProgress(15);
      updateStep("chunk", "done", "0.6s");

      // Step 3: Transcribe
      updateStep("transcribe", "active");
      for (let i = 0; i < chunkCount; i++) {
        if (cancelled.current) return;
        setChunkStatuses((prev) => prev.map((s, idx) => (idx === i ? "active" : s)));
        setChunksCompleted(i + 1);
        setStatusText(`Transcribing chunk ${i + 1} of ${chunkCount}...`);
        setProgress(15 + Math.round(((i + 1) / chunkCount) * 60));
        await delay(800);
        if (cancelled.current) return;
        setChunkStatuses((prev) => prev.map((s, idx) => (idx === i ? "done" : s)));
        setRecentlyCompleted(i);
        setTimeout(() => setRecentlyCompleted((curr) => (curr === i ? null : curr)), 600);
      }
      updateStep("transcribe", "done", `${(chunkCount * 0.8).toFixed(1)}s`);

      // Step 4: Merge
      if (cancelled.current) return;
      updateStep("merge", "active");
      setStatusText("Merging results...");
      await delay(1200);
      if (cancelled.current) return;
      setProgress(90);
      updateStep("merge", "done", "0.9s");

      // Step 5: Format
      updateStep("format", "active");
      setStatusText("Finalizing transcript...");
      await delay(1000);
      if (cancelled.current) return;
      setProgress(100);
      updateStep("format", "done", "0.5s");

      await delay(600);
      if (cancelled.current) return;

      onComplete({
        filename: fileInfo.name,
        duration: fileInfo.estimatedDuration,
        language: "English (detected)",
        processingTime: `${elapsed + 5}s`,
        wordCount: MOCK_TRANSCRIPT.split(/\s+/).length,
        transcript: MOCK_TRANSCRIPT,
      });
    };

    run();
    return () => { cancelled.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateStep(id: string, status: ProcessingStep["status"], timing?: string) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status, timing } : s))
    );
  }

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const estimatedRemaining = Math.max(0, Math.round(((100 - progress) / Math.max(progress, 1)) * elapsed));

  // Ring dimensions
  const ringSize = typeof window !== "undefined" && window.innerWidth < 768 ? 160 : 200;
  const ringRadius = (ringSize / 2) - 16;
  const circumference = 2 * Math.PI * ringRadius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-6 sm:gap-8"
    >
      {/* Neon Conduit Progress Ring */}
      <div className="relative" style={{ width: ringSize, height: ringSize }}>
        {/* Glow effect behind ring */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-30"
          style={{
            background: `conic-gradient(from 0deg, #00d4ff, #8b5cf6, #00d4ff)`,
          }}
        />
        <svg width={ringSize} height={ringSize} className="-rotate-90 relative z-10">
          <defs>
            <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#00d4ff" />
            </linearGradient>
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Dark track */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
            opacity="0.3"
          />
          {/* Glowing progress arc */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            fill="none"
            stroke="url(#neonGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            filter="url(#neonGlow)"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight">{progress}%</span>
        </div>
      </div>

      {/* Status Text */}
      <motion.div
        className="text-center space-y-2"
        key={statusText}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-base sm:text-lg font-medium">{statusText}</p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(elapsed)}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span>~{formatTime(estimatedRemaining)} remaining</span>
        </div>
      </motion.div>

      {/* Stepped Pipeline Indicator */}
      <div className="w-full max-w-md px-2">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step dot */}
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  className="relative flex items-center justify-center"
                  animate={step.status === "active" ? {
                    boxShadow: [
                      "0 0 0px rgba(0, 217, 255, 0.4)",
                      "0 0 16px rgba(0, 217, 255, 0.6)",
                      "0 0 0px rgba(0, 217, 255, 0.4)",
                    ],
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ borderRadius: "50%" }}
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-300 ${
                      step.status === "done"
                        ? "bg-success text-success-foreground shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                        : step.status === "active"
                        ? "bg-accent/20 text-accent border-2 border-accent"
                        : "bg-muted/50 text-muted-foreground/40 border border-border/50"
                    }`}
                  >
                    {step.status === "done" ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                    ) : step.status === "active" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                </motion.div>
                <span className={`text-[10px] sm:text-xs font-medium transition-colors duration-200 ${
                  step.status === "done"
                    ? "text-success"
                    : step.status === "active"
                    ? "text-accent"
                    : "text-muted-foreground/40"
                }`}>
                  {STEP_LABELS[step.id]}
                </span>
              </div>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="flex-1 h-px mx-1.5 sm:mx-2 mt-[-18px]">
                  <div
                    className={`h-full transition-all duration-500 ${
                      step.status === "done" ? "bg-success/60" : "bg-border/40"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Technical Log Accordion */}
      <div className="w-full max-w-md">
        <Accordion type="single" collapsible>
          <AccordionItem value="log" className="border-none">
            <div className="glassmorphism-card rounded-2xl overflow-hidden">
              <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline px-5 py-3">
                <span className="font-mono text-xs">Technical Log</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-5 pb-4 space-y-1.5 max-h-48 overflow-y-auto">
                  {Array.from({ length: chunkCount }).map((_, i) => {
                    const status = chunkStatuses[i];
                    const isFlare = recentlyCompleted === i;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{
                          opacity: status === "pending" ? 0.3 : 1,
                          x: 0,
                          backgroundColor: isFlare ? "rgba(0, 212, 255, 0.08)" : "transparent",
                        }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-between py-1.5 px-3 rounded-lg font-mono text-xs"
                      >
                        <span className="text-muted-foreground">
                          Chunk #{String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`font-bold ${
                            status === "done"
                              ? "text-success"
                              : status === "active"
                              ? "text-accent"
                              : "text-muted-foreground/30"
                          }`}
                        >
                          {status === "done" ? "[SUCCESS]" : status === "active" ? "[PROCESSING...]" : "[PENDING]"}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </AccordionContent>
            </div>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Cancel Button with red glow */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { cancelled.current = true; onCancel(); }}
          className="mt-2 px-6 font-mono text-xs text-destructive hover:text-destructive border border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]"
        >
          <X className="w-3.5 h-3.5 mr-1.5" />
          Cancel
        </Button>
      </motion.div>
    </motion.div>
  );
}
