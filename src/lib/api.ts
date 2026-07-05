import type {
  TranscribeResponse,
  TranscribeOptions,
  JobStatusResponse,
  JobResultResponse,
  ApiError,
} from "@/types/aurascript";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? "https://www.aurascript.au";

// Max enforced by backend — show friendly error above this
export const MAX_FILE_BYTES = 700 * 1024 * 1024;

// Free-tier per-file duration cap enforced by the backend (30 minutes).
// This is a courtesy check only — the backend rejects the job regardless.
export const FREE_TIER_MAX_DURATION_SECONDS = 1800;

export const ACCEPTED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
  "audio/aac",
  "audio/webm",
  "video/webm",
  "video/mp4",
  "video/quicktime",
];

export const ACCEPTED_EXTENSIONS = ".mp3,.wav,.m4a,.ogg,.flac,.aac,.webm,.mp4,.mov";

// ── Headers ───────────────────────────────────────────────────────────────────
async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};

  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

// ── Error helper ──────────────────────────────────────────────────────────────
async function parseError(res: Response): Promise<ApiError> {
  let body: Record<string, unknown> = {};
  try {
    body = await res.json();
  } catch {
    /* non-JSON body */
  }
  return {
    status: res.status,
    code: body.error_code as string | undefined,
    message: (body.message as string | undefined) ?? res.statusText,
    retryAfter: res.headers.get("Retry-After"),
    requestId: res.headers.get("X-Request-ID"),
    detail: body.detail as ApiError["detail"],
  };
}

// ── Internal: XHR PUT directly to a GCS signed URL ───────────────────────────

interface PresignedUploadUrl {
  upload_url: string;
  gcs_path: string;
}

function uploadToGCS(
  uploadUrl: string,
  file: File,
  onUploadProgress?: (pct: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (signal) {
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new DOMException("Aborted", "AbortError"));
      });
    }

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onUploadProgress) {
        onUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject({
          status: xhr.status,
          message: "GCS upload failed.",
          code: "GCS_UPLOAD_FAILED",
        } as ApiError);
      }
    });

    xhr.addEventListener("error", () =>
      reject({ status: 0, message: "Network error during GCS upload." } as ApiError)
    );

    xhr.addEventListener("abort", () =>
      reject(new DOMException("Aborted", "AbortError"))
    );

    xhr.open("PUT", uploadUrl);
    // GCS signed URL requires Content-Type to be absent or match what was signed.
    // We sign without a content_type constraint so we omit it here.
    xhr.send(file);
  });
}

// ── Internal: multipart POST to /transcribe (existing path) ──────────────────

function submitMultipart(
  file: File,
  options: TranscribeOptions,
  onUploadProgress: ((pct: number) => void) | undefined,
  signal: AbortSignal | undefined,
  headers: Record<string, string>,
): Promise<TranscribeResponse> {
  const form = new FormData();
  form.append("audio_file", file);
  if (options.languageHint) form.append("language_hint", options.languageHint);
  if (options.numSpeakers)  form.append("num_speakers", String(options.numSpeakers));
  if (options.webhookUrl)   form.append("webhook_url", options.webhookUrl);
  if (options.translateToEnglish) form.append("translate_to", "english");

  return new Promise<TranscribeResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (signal) {
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new DOMException("Aborted", "AbortError"));
      });
    }

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onUploadProgress) {
        onUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 202) {
        try {
          resolve(JSON.parse(xhr.responseText) as TranscribeResponse);
        } catch {
          reject({ status: 500, message: "Invalid JSON in response." } as ApiError);
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          reject({
            status: xhr.status,
            message: body.detail ?? body.message ?? xhr.statusText,
            code: body.code,
          } as ApiError);
        } catch {
          reject({ status: xhr.status, message: xhr.statusText } as ApiError);
        }
      }
    });

    xhr.addEventListener("error", () =>
      reject({ status: 0, message: "Network error during upload." } as ApiError)
    );

    xhr.addEventListener("abort", () =>
      reject(new DOMException("Aborted", "AbortError"))
    );

    xhr.open("POST", `${BASE_URL}/transcribe`);
    // DO NOT set Content-Type — browser sets multipart boundary automatically.
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.send(form);
  });
}

// ── Internal: POST gcs_path to /transcribe after direct GCS upload ────────────

async function submitGCSPath(
  gcsPath: string,
  options: TranscribeOptions,
  signal: AbortSignal | undefined,
  headers: Record<string, string>,
): Promise<TranscribeResponse> {
  const form = new FormData();
  form.append("gcs_path", gcsPath);
  if (options.languageHint) form.append("language_hint", options.languageHint);
  if (options.numSpeakers)  form.append("num_speakers", String(options.numSpeakers));
  if (options.webhookUrl)   form.append("webhook_url", options.webhookUrl);
  if (options.translateToEnglish) form.append("translate_to", "english");

  const res = await fetch(`${BASE_URL}/transcribe`, {
    method: "POST",
    // DO NOT set Content-Type — let browser set multipart boundary.
    headers,
    body: form,
    signal,
  });

  if (res.status === 202) return res.json() as Promise<TranscribeResponse>;

  const body: Record<string, unknown> = await res.json().catch(() => ({}));
  throw {
    status: res.status,
    message: body.detail ?? body.message ?? res.statusText,
    code: body.code,
  } as ApiError;
}

// ── POST /transcribe ──────────────────────────────────────────────────────────

/**
 * Submit an audio file for transcription.
 *
 * Tries the presigned GCS upload path first (direct-to-GCS, avoids routing
 * large files through the backend). Falls back to multipart if the server
 * returns 503 (GCS not configured) or if the presigned-URL fetch fails.
 *
 * @param onUploadProgress - Optional callback fired with 0–100 upload percentage.
 * @param signal           - Optional AbortSignal to cancel the in-flight XHR.
 */
export function submitTranscription(
  file: File,
  options: TranscribeOptions = {},
  onUploadProgress?: (pct: number) => void,
  signal?: AbortSignal,
): Promise<TranscribeResponse> {
  if (file.size > MAX_FILE_BYTES) {
    return Promise.reject({
      status: 413,
      message: "File exceeds 700 MB limit.",
      code: "FILE_TOO_LARGE",
    } as ApiError);
  }

  return (async () => {
    const headers = await authHeaders();

    // Attempt presigned URL path — if the server returns 503 (GCS not
    // configured) or any network error occurs, fall through to multipart.
    let presigned: PresignedUploadUrl | null = null;
    try {
      const res = await fetch(`${BASE_URL}/upload/presigned-url`, { headers });
      if (res.ok) {
        presigned = (await res.json()) as PresignedUploadUrl;
      }
      // Non-2xx (e.g. 503 = GCS not configured) → fall through to multipart.
    } catch {
      // Network error fetching presigned URL → fall through to multipart.
    }

    if (presigned) {
      // Upload directly to GCS (progress tracked here), then notify backend.
      await uploadToGCS(presigned.upload_url, file, onUploadProgress, signal);
      return submitGCSPath(presigned.gcs_path, options, signal, headers);
    }

    // Multipart fallback: send file through the backend as before.
    return submitMultipart(file, options, onUploadProgress, signal, headers);
  })();
}

// ── GET /transcribe/status/{job_id} ──────────────────────────────────────────
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${BASE_URL}/transcribe/status/${jobId}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

// ── GET /transcribe/result/{job_id} ──────────────────────────────────────────
export async function getJobResult(jobId: string): Promise<JobResultResponse> {
  const res = await fetch(`${BASE_URL}/transcribe/result/${jobId}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

// ── DELETE /transcribe/{job_id} ───────────────────────────────────────────────
export async function cancelJob(jobId: string): Promise<void> {
  await fetch(`${BASE_URL}/transcribe/${jobId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
}

// ── POST /translate/{job_id} ──────────────────────────────────────────────────
export async function translateTranscript(jobId: string): Promise<{ translated_transcript: string }> {
  const cleanJobId = jobId.split(":")[0];
  const res = await fetch(`${BASE_URL}/translate/${cleanJobId}`, {
    method: "POST",
    headers: await authHeaders(),
  });

  if (!res.ok) throw await parseError(res);
  return res.json();
}

// ── WebSocket URL builder ─────────────────────────────────────────────────────
export async function buildWsUrl(jobId: string, lastSequence: number = 0): Promise<string> {
  // Strip /api path suffix — WS must go through /ws/ nginx location, not /api/ (no upgrade headers there)
  const wsBase = BASE_URL.replace(/\/api\/?$/, "").replace(/^https/, "wss").replace(/^http/, "ws");
  const url = new URL(`${wsBase}/ws/transcribe/${jobId}`);

  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    url.searchParams.set("token", apiKey);
  } else {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      url.searchParams.set("token", session.access_token);
    }
  }

  if (lastSequence > 0) url.searchParams.set("last_sequence", String(lastSequence));
  return url.toString();
}

// ── Fallback polling ──────────────────────────────────────────────────────────
export async function pollUntilComplete(
  jobId: string,
  onUpdate: (s: JobStatusResponse) => void,
  intervalMs = 3000,
): Promise<JobResultResponse> {
  while (true) {
    const status = await getJobStatus(jobId);
    onUpdate(status);
    if (status.status === "completed") return getJobResult(jobId);
    if (status.status === "failed")
      throw { status: 500, message: status.error_message ?? "Job failed", code: status.error_code } as ApiError;
    if (status.status === "cancelled") throw { status: 400, message: "Job cancelled", code: "CANCELLED" } as ApiError;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
