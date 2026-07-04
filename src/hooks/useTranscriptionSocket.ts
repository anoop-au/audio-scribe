import { useEffect, useRef, useCallback, useState } from "react";
import { buildWsUrl } from "@/lib/api";
import type { JobCompleteEvent, JobFailedEvent, ProcessingState } from "@/types/aurascript";

export type SocketStatus = "connecting" | "connected" | "reconnecting" | "closed" | "failed";

interface UseTranscriptionSocketOptions {
  jobId: string | null;
  onComplete: (event: JobCompleteEvent) => void;
  onFailed:   (event: JobFailedEvent) => void;
}

const STAGE_LABELS: Record<string, string> = {
  ANALYZING:        "Analysing audio…",
  PLANNING:         "Planning chunks…",
  CHUNKING:         "Segmenting audio…",
  TRANSCRIBING:     "Transcribing…",
  QUALITY_CHECKING: "Checking quality…",
  STITCHING:        "Stitching transcript…",
  FINALIZING:       "Finalising…",
};

export function useTranscriptionSocket({
  jobId,
  onComplete,
  onFailed,
}: UseTranscriptionSocketOptions) {
  const [state, setState] = useState<ProcessingState>({
    progress: 0,
    stage: "Waiting…",
    chunkCount: 0,
    chunksComplete: 0,
    previewLines: [],
    qualityScores: [],
  });
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("connecting");

  const wsRef               = useRef<WebSocket | null>(null);
  const lastSequenceRef     = useRef(0);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef        = useRef(true);

  // Keep callback refs current so handleEvent never captures a stale closure.
  const onCompleteRef = useRef(onComplete);
  const onFailedRef   = useRef(onFailed);
  onCompleteRef.current = onComplete;
  onFailedRef.current   = onFailed;

  const connect = useCallback(async () => {
    if (!jobId || !isMountedRef.current) return;

    setSocketStatus(reconnectAttemptsRef.current > 0 ? "reconnecting" : "connecting");
    const wsUrl = await buildWsUrl(jobId, lastSequenceRef.current);
    if (!isMountedRef.current) return;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      reconnectAttemptsRef.current = 0;
      setSocketStatus("connected");
    };

    ws.onmessage = (e: MessageEvent) => {
      if (!isMountedRef.current) return;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event: any = JSON.parse(e.data as string);
        lastSequenceRef.current = event.sequence;
        handleEvent(event);
      } catch { /* ignore parse errors */ }
    };

    ws.onclose = (e: CloseEvent) => {
      if (!isMountedRef.current) return;
      if (e.code === 1000) { setSocketStatus("closed"); return; }
      if (e.code === 1008) { setSocketStatus("failed"); return; }
      if (reconnectAttemptsRef.current < 5) {
        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30_000);
        reconnectAttemptsRef.current++;
        setTimeout(connect, delay);
      } else {
        setSocketStatus("failed");
      }
    };

    ws.onerror = () => { ws.close(); };
  }, [jobId]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleEvent(event: any) {
    const eventType = event.event_type as string;

    setState(prev => {
      switch (eventType) {
        case "JOB_ACCEPTED":
          return { ...prev, progress: 2, stage: "Job accepted…" };

        case "AUDIO_ANALYZED":
          return {
            ...prev,
            progress: 5,
            stage: `Audio analysed — ${Math.round(event.duration_seconds)}s`,
            audioInfo: {
              durationSeconds: event.duration_seconds,
              qualityWarnings: event.quality_warnings,
            },
          };

        case "PLAN_CREATED":
          return {
            ...prev,
            progress: 8,
            stage: `Planning ${event.estimated_chunks} chunks…`,
            chunkCount: event.estimated_chunks,
          };

        case "CHUNKING_STARTED":
          return { ...prev, stage: "Segmenting audio…" };

        case "CHUNKING_COMPLETE":
          return {
            ...prev,
            progress: 12,
            stage: "Audio segmented.",
            chunkCount: event.actual_chunk_count,
          };

        case "CHUNK_PROCESSING_STARTED":
          return {
            ...prev,
            stage: `Transcribing chunk ${event.chunk_index + 1} of ${event.total_chunks}…`,
          };

        case "CHUNK_RETRY":
          return { ...prev, stage: `Retrying chunk ${event.chunk_index + 1}…` };

        case "AGENT_DECISION":
          return { ...prev, stage: event.decision };

        case "CHUNK_TRANSCRIBED": {
          const newChunksComplete = prev.chunksComplete + 1;
          const totalChunks = prev.chunkCount || event.total_chunks || 1;
          // Interpolate progress 12% → 87% as chunks complete
          const chunkProgress = 12 + Math.round((newChunksComplete / totalChunks) * 75);
          return {
            ...prev,
            chunksComplete: newChunksComplete,
            progress: Math.max(prev.progress, Math.min(chunkProgress, 87)),
            previewLines: [...prev.previewLines, event.preview],
          };
        }

        case "QUALITY_CHECKED": {
          const scores = [...prev.qualityScores];
          scores[event.chunk_index] = event.final_score;
          return { ...prev, qualityScores: scores };
        }

        case "PROGRESS_HEARTBEAT":
          return {
            ...prev,
            progress: Math.max(prev.progress, event.overall_progress_percent),
            stage: STAGE_LABELS[event.current_stage] ?? `${event.current_stage}…`,
          };

        case "STITCHING_STARTED":
          return { ...prev, progress: 90, stage: "Stitching transcript…" };

        case "STITCHING_COMPLETE":
          return { ...prev, progress: 97, stage: "Finalising…" };

        case "JOB_COMPLETE":
          return { ...prev, progress: 100, stage: "Complete!" };

        case "JOB_FAILED":
          return { ...prev, stage: "Failed." };

        default:
          return prev;
      }
    });

    // Terminal callbacks must fire OUTSIDE setState — calling them inside
    // setState runs during React's render phase and can abort the update.
    if (eventType === "JOB_COMPLETE") onCompleteRef.current(event as JobCompleteEvent);
    else if (eventType === "JOB_FAILED") onFailedRef.current(event as JobFailedEvent);
  }

  useEffect(() => {
    isMountedRef.current = true;
    connect();
    return () => {
      isMountedRef.current = false;
      wsRef.current?.close(1000);
    };
  }, [connect]);

  const cancel = useCallback(() => {
    wsRef.current?.close(1000);
  }, []);

  return { state, socketStatus, cancel };
}
