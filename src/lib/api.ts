import type { ProcessingOptions, TranscriptionResult } from "./mock";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://aurascript.store";
const WS_BASE = import.meta.env.VITE_WS_URL ?? "wss://aurascript.store";

export type StepEvent = {
  type: "step";
  step: string;
  status: "active" | "done";
  detail?: string;
  total_chunks?: number;
};

export type ChunkEvent = {
  type: "chunk_progress";
  index: number;
  total: number;
};

export type ErrorEvent = {
  type: "error";
  message: string;
};

export type CompleteEvent = {
  type: "complete";
  result: {
    filename: string;
    duration: string;
    language: string;
    wordCount: number;
    chunks: number;
    transcript: string;
    outputFormat: string;
  };
};

export type SSEEvent = StepEvent | ChunkEvent | ErrorEvent | CompleteEvent;

export async function transcribeFile(
  file: File,
  options: ProcessingOptions,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<TranscriptionResult> {
  // Step 1: Upload file and get job_id
  const formData = new FormData();
  formData.append("file", file);
  formData.append("output_format", options.outputFormat);
  formData.append("translate_to_english", String(options.translateToEnglish));
  if (options.languageHint) {
    formData.append("language_hint", options.languageHint);
  }

  const uploadRes = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: formData,
    signal,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Upload failed (${uploadRes.status}): ${text}`);
  }

  const { job_id } = (await uploadRes.json()) as { job_id: string };

  // Step 2: Connect to WebSocket for progress and results
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException("Aborted", "AbortError"));
    }

    const ws = new WebSocket(`${WS_BASE}/ws/${job_id}`);

    const cleanup = () => ws.close();

    if (signal) {
      signal.addEventListener("abort", () => {
        cleanup();
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    }

    ws.onmessage = (msg) => {
      let event: SSEEvent;
      try {
        event = JSON.parse(msg.data);
      } catch {
        return;
      }

      onEvent(event);

      if (event.type === "error") {
        cleanup();
        reject(new Error(event.message));
      }

      if (event.type === "complete") {
        const r = event.result;
        cleanup();
        resolve({
          filename: r.filename,
          duration: r.duration,
          language: r.language,
          processingTime: "see server logs",
          wordCount: r.wordCount,
          transcript: r.transcript,
        });
      }
    };

    ws.onerror = () => {
      reject(new Error("WebSocket connection failed"));
    };

    ws.onclose = (e) => {
      if (e.code !== 1000 && e.code !== 1005) {
        reject(new Error(`WebSocket closed unexpectedly (${e.code})`));
      }
    };
  });
}
