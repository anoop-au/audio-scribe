import { useEffect, useRef, useCallback, useState } from "react";
import { buildWsUrl } from "@/lib/api";
import type { AnyEvent, ProcessingState, JobCompleteEvent, JobFailedEvent } from "@/types/aurascript";

export type SocketStatus = "connecting" | "connected" | "reconnecting" | "closed" | "failed";

interface UseTranscriptionSocketOptions {
  jobId: string | null;
  onComplete: (event: JobCompleteEvent) => void;
  onFailed:   (event: JobFailedEvent) => void;
}

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

  const wsRef              = useRef<WebSocket | null>(null);
  const lastSequenceRef    = useRef(0);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef       = useRef(true);

  const connect = useCallback(() => {
    if (!jobId || !isMountedRef.current) return;

    setSocketStatus(reconnectAttemptsRef.current > 0 ? "reconnecting" : "connecting");
    const ws = new WebSocket(buildWsUrl(jobId, lastSequenceRef.current));
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      reconnectAttemptsRef.current = 0;
      setSocketStatus("connected");
    };

    ws.onmessage = (e: MessageEvent) => {
      if (!isMountedRef.current) return;
      try {
        const event: AnyEvent = JSON.parse(e.data as string);
        lastSequenceRef.current = event.sequence;
        handleEvent(event);
      } catch { /* ignore parse errors */ }
    };

    ws.onclose = (e: CloseEvent) => {
      if (!isMountedRef.current) return;
      if (e.code === 1000) { setSocketStatus("closed"); return; }
      if (e.code === 1008) { setSocketStatus("failed"); return; } // auth failure — don't retry
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

  function handleEvent(event: AnyEvent) {
    setState(prev => {
      switch (event.event_type) {
        case "job.accepted":
          return { ...prev, progress: 2, stage: "Job accepted…" };

        case "job.audio_analyzed":
          return {
            ...prev,
            progress: 5,
            stage: `Audio analysed — ${Math.round(event.duration_seconds)}s`,
            audioInfo: {
              durationSeconds: event.duration_seconds,
              qualityWarnings: event.quality_warnings,
            },
          };

        case "job.plan_created":
          return {
            ...prev,
            progress: 8,
            stage: `Planning ${event.chunk_count} chunks…`,
            chunkCount: event.chunk_count,
          };

        case "job.chunking_complete":
          return { ...prev, progress: 12, stage: "Audio segmented.", chunkCount: event.chunk_count };

        case "job.chunk_transcribed":
          return {
            ...prev,
            chunksComplete: prev.chunksComplete + 1,
            previewLines: [...prev.previewLines, event.preview],
          };

        case "job.quality_checked": {
          const scores = [...prev.qualityScores];
          scores[event.chunk_index] = event.score;
          return { ...prev, qualityScores: scores };
        }

        case "job.progress_heartbeat":
          return {
            ...prev,
            progress: Math.max(prev.progress, 12 + event.progress_pct * 0.75),
            stage: `Transcribing… ${event.chunks_done}/${event.total_chunks} chunks`,
            chunksComplete: event.chunks_done,
          };

        case "job.stitching_started":
          return { ...prev, progress: 90, stage: "Stitching transcript…" };

        case "job.stitching_complete":
          return { ...prev, progress: 97, stage: "Finalising…" };

        case "job.complete":
          onComplete(event);
          return { ...prev, progress: 100, stage: "Complete!" };

        case "job.failed":
          onFailed(event);
          return { ...prev, stage: "Failed." };

        default:
          return prev;
      }
    });
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
