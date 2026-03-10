import type { ProcessingOptions, TranscriptionResult } from "./mock";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://172.105.187.21:8000";

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
  const formData = new FormData();
  formData.append("file", file);
  formData.append("output_format", options.outputFormat);
  formData.append("translate_to_english", String(options.translateToEnglish));
  if (options.languageHint) {
    formData.append("language_hint", options.languageHint);
  }

  const response = await fetch(`${API_BASE}/transcribe`, {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Server error ${response.status}: ${text}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: TranscriptionResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;

      let event: SSEEvent;
      try {
        event = JSON.parse(raw);
      } catch {
        continue;
      }

      onEvent(event);

      if (event.type === "error") {
        throw new Error(event.message);
      }

      if (event.type === "complete") {
        const r = event.result;
        finalResult = {
          filename: r.filename,
          duration: r.duration,
          language: r.language,
          processingTime: "see server logs",
          wordCount: r.wordCount,
          transcript: r.transcript,
        };
      }
    }
  }

  if (!finalResult) {
    throw new Error("No result received from server");
  }

  return finalResult;
}
