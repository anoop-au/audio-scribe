import type {
  TranscribeResponse,
  TranscribeOptions,
  JobStatusResponse,
  JobResultResponse,
  ApiError,
} from "@/types/aurascript";

const API_KEY  = import.meta.env.VITE_API_KEY as string;
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? "https://www.aurascript.au";

// Max enforced by backend — show friendly error above this
export const MAX_FILE_BYTES = 700 * 1024 * 1024;

export const ACCEPTED_MIME_TYPES = [
  "audio/mpeg", "audio/mp3",
  "audio/wav", "audio/x-wav",
  "audio/mp4", "audio/m4a", "audio/x-m4a",
  "audio/ogg",
  "audio/flac", "audio/x-flac",
  "audio/aac",
  "audio/webm", "video/webm",
  "video/mp4",
];

export const ACCEPTED_EXTENSIONS = ".mp3,.wav,.m4a,.ogg,.flac,.aac,.webm,.mp4";

// ── Headers ───────────────────────────────────────────────────────────────────
function authHeaders(): HeadersInit {
  return { "X-Api-Key": API_KEY };
}

// ── Error helper ──────────────────────────────────────────────────────────────
async function parseError(res: Response): Promise<ApiError> {
  let body: Record<string, unknown> = {};
  try { body = await res.json(); } catch { /* non-JSON body */ }
  return {
    status: res.status,
    code: body.error_code as string | undefined,
    message: (body.message as string | undefined) ?? res.statusText,
    retryAfter: res.headers.get("Retry-After"),
    requestId: res.headers.get("X-Request-ID"),
    detail: body.detail as ApiError["detail"],
  };
}

// ── POST /transcribe ──────────────────────────────────────────────────────────
export async function submitTranscription(
  file: File,
  options: TranscribeOptions = {}
): Promise<TranscribeResponse> {
  if (file.size > MAX_FILE_BYTES) {
    throw { status: 413, message: "File exceeds 700 MB limit.", code: "FILE_TOO_LARGE" } as ApiError;
  }

  const form = new FormData();
  form.append("file", file);
  if (options.languageHint)  form.append("language_hint", options.languageHint);
  if (options.numSpeakers)   form.append("num_speakers", String(options.numSpeakers));
  if (options.webhookUrl)    form.append("webhook_url", options.webhookUrl);

  // Do NOT set Content-Type — browser must set multipart boundary
  const res = await fetch(`${BASE_URL}/transcribe`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });

  if (!res.ok) throw await parseError(res);
  return res.json();
}

// ── GET /transcribe/status/{job_id} ──────────────────────────────────────────
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${BASE_URL}/transcribe/status/${jobId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

// ── GET /transcribe/result/{job_id} ──────────────────────────────────────────
export async function getJobResult(jobId: string): Promise<JobResultResponse> {
  const res = await fetch(`${BASE_URL}/transcribe/result/${jobId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

// ── DELETE /transcribe/{job_id} ───────────────────────────────────────────────
export async function cancelJob(jobId: string): Promise<void> {
  await fetch(`${BASE_URL}/transcribe/${jobId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// ── WebSocket URL builder ─────────────────────────────────────────────────────
export function buildWsUrl(jobId: string, lastSequence: number = 0): string {
  const wsBase = BASE_URL.replace(/^https/, "wss").replace(/^http/, "ws");
  const url = new URL(`${wsBase}/ws/transcribe/${jobId}`);
  url.searchParams.set("token", API_KEY);
  if (lastSequence > 0) url.searchParams.set("last_sequence", String(lastSequence));
  return url.toString();
}

// ── Fallback polling ──────────────────────────────────────────────────────────
export async function pollUntilComplete(
  jobId: string,
  onUpdate: (s: JobStatusResponse) => void,
  intervalMs = 3000
): Promise<JobResultResponse> {
  while (true) {
    const status = await getJobStatus(jobId);
    onUpdate(status);
    if (status.status === "completed") return getJobResult(jobId);
    if (status.status === "failed")    throw { status: 500, message: status.error_message ?? "Job failed", code: status.error_code } as ApiError;
    if (status.status === "cancelled") throw { status: 400, message: "Job cancelled", code: "CANCELLED" } as ApiError;
    await new Promise(r => setTimeout(r, intervalMs));
  }
}
