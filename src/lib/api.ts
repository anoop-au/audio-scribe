import type { ProcessingOptions, TranscriptionResult } from "./mock";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://aurascript.store/ws/transcribe";

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
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);

    const cleanup = () => {
      ws.close();
    };

    if (signal) {
      signal.addEventListener("abort", () => {
        cleanup();
        reject(new DOMException("Aborted", "AbortError"));
      });
    }

    ws.onopen = async () => {
      // Send metadata first as JSON
      ws.send(JSON.stringify({
        filename: file.name,
        output_format: options.outputFormat,
        translate_to_english: options.translateToEnglish,
        language_hint: options.languageHint || undefined,
      }));

      // Then send the file as binary
      const buffer = await file.arrayBuffer();
      ws.send(buffer);
    };

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
