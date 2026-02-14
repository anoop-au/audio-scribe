import { useEffect, useState, useRef } from "react";
import { Check, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { createInitialSteps, MOCK_TRANSCRIPT, type ProcessingStep, type TranscriptionResult, type FileInfo } from "@/lib/mock";

interface ProcessingScreenProps {
  fileInfo: FileInfo;
  onComplete: (result: TranscriptionResult) => void;
  onCancel: () => void;
}

export default function ProcessingScreen({ fileInfo, onComplete, onCancel }: ProcessingScreenProps) {
  const chunkCount = Math.max(5, Math.min(10, Math.round(fileInfo.size / (1024 * 512))));
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>(createInitialSteps(chunkCount));
  const [statusText, setStatusText] = useState("Analyzing file...");
  const [elapsed, setElapsed] = useState(0);
  const [chunksCompleted, setChunksCompleted] = useState(0);
  const cancelled = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    cancelled.current = false;
    const run = async () => {
      const delay = (ms: number) =>
        new Promise<void>((resolve) => {
          const id = setTimeout(() => resolve(), ms);
          // store for cleanup
          return () => clearTimeout(id);
        });

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
      for (let i = 1; i <= chunkCount; i++) {
        if (cancelled.current) return;
        setChunksCompleted(i);
        setStatusText(`Transcribing chunk ${i} of ${chunkCount}...`);
        setProgress(15 + Math.round((i / chunkCount) * 60));
        await delay(800);
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

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-8 animate-slide-fade-in">
      {/* Progress Ring */}
      <div className="relative">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle
            cx="70" cy="70" r="54" fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="progress-ring"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold font-mono">{progress}%</span>
        </div>
      </div>

      {/* Status */}
      <div className="text-center space-y-2">
        <p className="text-lg font-medium">{statusText}</p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatTime(elapsed)}</span>
          <span>~{formatTime(estimatedRemaining)} remaining</span>
        </div>
      </div>

      {/* Detailed Steps */}
      <div className="w-full max-w-md">
        <Accordion type="single" collapsible defaultValue="steps">
          <AccordionItem value="steps" className="border-none">
            <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline py-2">
              Detailed progress
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3 text-sm">
                    {step.status === "done" ? (
                      <Check className="w-4 h-4 text-success shrink-0" />
                    ) : step.status === "active" ? (
                      <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={step.status === "pending" ? "text-muted-foreground/50" : ""}>
                      {step.label}
                      {step.id === "transcribe" && step.status === "active"
                        ? ` (${chunksCompleted}/${chunkCount})`
                        : ""}
                    </span>
                    {step.timing && (
                      <span className="ml-auto text-xs text-muted-foreground font-mono">{step.timing}</span>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Cancel */}
      <Button
        variant="destructive"
        size="sm"
        onClick={() => { cancelled.current = true; onCancel(); }}
        className="mt-2"
      >
        Cancel
      </Button>
    </div>
  );
}
