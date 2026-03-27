import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Check, Loader2, Clock, X, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { createInitialSteps, type ProcessingStep, type TranscriptionResult, type FileInfo, type ProcessingOptions } from "@/lib/mock";
import { submitTranscription, cancelJob } from "@/lib/api";
import { useTranscriptionSocket } from "@/hooks/useTranscriptionSocket";
import type { JobCompleteEvent, JobFailedEvent, JobResultResponse } from "@/types/aurascript";

interface ProcessingScreenProps {
  file: File;
  fileInfo: FileInfo;
  options: ProcessingOptions;
  onComplete: (result: TranscriptionResult, jobResult?: JobResultResponse) => void;
  onCancel: () => void;
}

const STEP_LABELS: Record<string, string> = {
  analyze: "Analyze",
  chunk: "Chunk",
  transcribe: "Transcribe",
  merge: "Merge",
  format: "Format",
};

export default function ProcessingScreen({ file, fileInfo, options, onComplete, onCancel }: ProcessingScreenProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>(createInitialSteps(1));
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const jobIdRef = useRef<string | null>(null);

  // Upload file and get job_id
  useEffect(() => {
    let cancelled = false;
    submitTranscription(file, {
      languageHint: options.languageHint,
      translateToEnglish: options.translateToEnglish,
    })
      .then((res) => {
        if (!cancelled) {
          setJobId(res.job_id);
          jobIdRef.current = res.job_id;
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? "Upload failed");
        }
      });
    return () => { cancelled = true; };
  }, []);

  const handleComplete = useCallback((event: JobCompleteEvent) => {
    const result: TranscriptionResult = {
      filename: file.name,
      duration: `${Math.round(event.metadata.duration_seconds)}s`,
      language: Array.isArray(event.metadata.languages_detected)
        ? (event.metadata.languages_detected as string[]).join(", ")
        : "auto",
      processingTime: event.metadata.processing_time_seconds
        ? `${Math.round(event.metadata.processing_time_seconds)}s`
        : "N/A",
      wordCount: event.transcript.split(/\s+/).length,
      transcript: event.transcript,
    };
    const rawJobResult: JobResultResponse = {
      job_id: event.job_id,
      status: "completed",
      transcript: event.transcript,
      speaker_map: event.speaker_map,
      metadata: event.metadata,
    };
    setTimeout(() => onComplete(result, rawJobResult), 600);
  }, [file.name, onComplete]);

  const handleFailed = useCallback((event: JobFailedEvent) => {
    setError(event.error_message ?? "Transcription failed");
  }, []);

  const { state, socketStatus, cancel: cancelSocket } = useTranscriptionSocket({
    jobId,
    onComplete: handleComplete,
    onFailed: handleFailed,
  });

  const progress = state.progress;
  const statusText = error ? "Failed" : state.stage;

  // Update steps based on progress
  useEffect(() => {
    if (state.chunkCount > 0) {
      setSteps(createInitialSteps(state.chunkCount));
    }

    const stepMap: Record<string, number> = { analyze: 5, chunk: 12, transcribe: 87, merge: 97, format: 100 };
    setSteps((prev) =>
      prev.map((s) => ({
        ...s,
        status: progress >= stepMap[s.id]
          ? "done" as const
          : progress >= (stepMap[s.id] - 10)
            ? "active" as const
            : "pending" as const,
      }))
    );
  }, [progress, state.chunkCount]);

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCancel = () => {
    cancelSocket();
    if (jobIdRef.current) {
      cancelJob(jobIdRef.current).catch(() => {});
    }
    onCancel();
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const estimatedTotalRef = useRef<number | null>(null);
  const estimatedRemaining = useMemo(() => {
    if (progress >= 100) return 0;
    if (progress > 5 && elapsed > 0) {
      const rate = progress / elapsed; // percent per second
      const totalEstimate = Math.round(100 / rate);
      // Lock in the first meaningful estimate, then only allow it to decrease
      if (estimatedTotalRef.current === null) {
        estimatedTotalRef.current = totalEstimate;
      } else {
        estimatedTotalRef.current = Math.min(estimatedTotalRef.current, totalEstimate);
      }
      return Math.max(0, estimatedTotalRef.current - elapsed);
    }
    return null; // not enough data yet
  }, [progress, elapsed]);
  const ringSize = typeof window !== "undefined" && window.innerWidth < 768 ? 160 : 200;
  const ringRadius = ringSize / 2 - 16;
  const circumference = 2 * Math.PI * ringRadius;
  const offset = circumference - (progress / 100) * circumference;

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 text-center py-8">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <div>
          <p className="text-base font-semibold text-destructive mb-1">Transcription failed</p>
          <p className="text-sm text-muted-foreground font-mono max-w-xs">{error}</p>
        </div>
        <Button variant="outline" onClick={onCancel}>Try again</Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-6 sm:gap-8"
    >
      {/* Progress Ring */}
      <div className="relative" style={{ width: ringSize, height: ringSize }}>
        <div className="absolute inset-0 rounded-full blur-xl opacity-30" style={{ background: "conic-gradient(from 0deg, #ff6a00, #ff2d92, #00d4ff, #ff6a00)" }} />
        <svg width={ringSize} height={ringSize} className="-rotate-90 relative z-10">
          <defs>
            <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff6a00" />
              <stop offset="50%" stopColor="#ff2d92" />
              <stop offset="100%" stopColor="#00d4ff" />
            </linearGradient>
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" opacity="0.3" />
          <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke="url(#neonGradient)" strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            filter="url(#neonGlow)" className="transition-all duration-500 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight">{progress}%</span>
        </div>
      </div>

      {/* Status */}
      <motion.div className="text-center space-y-2" key={statusText} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-base sm:text-lg font-medium">{statusText}</p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{formatTime(elapsed)}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>~{formatTime(estimatedRemaining)} remaining</span>
        </div>
      </motion.div>

      {/* Steps */}
      <div className="w-full max-w-md px-2">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  className="relative flex items-center justify-center"
                  animate={step.status === "active" ? { boxShadow: ["0 0 0px rgba(0,217,255,0.4)", "0 0 16px rgba(0,217,255,0.6)", "0 0 0px rgba(0,217,255,0.4)"] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ borderRadius: "50%" }}
                >
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-300 ${
                    step.status === "done" ? "bg-success text-success-foreground shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                    : step.status === "active" ? "bg-accent/20 text-accent border-2 border-accent"
                    : "bg-muted/50 text-muted-foreground/40 border border-border/50"
                  }`}>
                    {step.status === "done" ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                        <Check className="w-4 h-4" />
                      </motion.div>
                    ) : step.status === "active" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : <span>{i + 1}</span>}
                  </div>
                </motion.div>
                <span className={`text-[10px] sm:text-xs font-medium transition-colors duration-200 ${
                  step.status === "done" ? "text-success" : step.status === "active" ? "text-accent" : "text-muted-foreground/40"
                }`}>{STEP_LABELS[step.id]}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px mx-1.5 sm:mx-2 mt-[-18px]">
                  <div className={`h-full transition-all duration-500 ${step.status === "done" ? "bg-success/60" : "bg-border/40"}`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Transcript Preview */}
      {state.previewLines.length > 0 && (
        <div className="w-full max-w-md">
          <Accordion type="single" collapsible>
            <AccordionItem value="preview" className="border-none">
              <div className="glassmorphism-card rounded-2xl overflow-hidden">
                <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline px-5 py-3">
                  <span className="font-mono text-xs">Live Preview ({state.chunksComplete}/{state.chunkCount} chunks)</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-5 pb-4 space-y-1.5 max-h-48 overflow-y-auto">
                    {state.previewLines.map((line, i) => (
                      <motion.p key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-muted-foreground font-mono leading-relaxed">
                        {line}
                      </motion.p>
                    ))}
                  </div>
                </AccordionContent>
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
        <Button variant="ghost" size="sm"
          onClick={handleCancel}
          className="mt-2 px-6 font-mono text-xs text-destructive hover:text-destructive border border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5 transition-all duration-300">
          <X className="w-3.5 h-3.5 mr-1.5" />Cancel
        </Button>
      </motion.div>
    </motion.div>
  );
}
