// ── Base event ────────────────────────────────────────────────────────────────
export interface BaseEvent {
  event_type: string;
  job_id: string;
  timestamp: string;
  sequence: number;
  schema_version: "1.1";
}

// ── All 15 event types ────────────────────────────────────────────────────────
export interface JobAcceptedEvent extends BaseEvent {
  event_type: "job.accepted";
  message: string;
}

export interface AudioAnalyzedEvent extends BaseEvent {
  event_type: "job.audio_analyzed";
  duration_seconds: number;
  sample_rate: number;
  channels: number;
  codec: string;
  bitrate: number;
  quality_warnings: string[];
}

export interface PlanCreatedEvent extends BaseEvent {
  event_type: "job.plan_created";
  chunk_count: number;
  strategy: string;
  estimated_duration_seconds: number;
}

export interface ChunkingStartedEvent extends BaseEvent {
  event_type: "job.chunking_started";
}

export interface ChunkingCompleteEvent extends BaseEvent {
  event_type: "job.chunking_complete";
  chunk_count: number;
}

export interface ChunkProcessingStartedEvent extends BaseEvent {
  event_type: "job.chunk_processing_started";
  chunk_index: number;
  total_chunks: number;
}

export interface ChunkTranscribedEvent extends BaseEvent {
  event_type: "job.chunk_transcribed";
  chunk_index: number;
  preview: string;
  confidence_score: number;
}

export interface QualityCheckedEvent extends BaseEvent {
  event_type: "job.quality_checked";
  chunk_index: number;
  score: number;
  decision: "accept" | "retry" | "flag";
  issues: string[];
}

export interface ChunkRetryEvent extends BaseEvent {
  event_type: "job.chunk_retry";
  chunk_index: number;
  reason: string;
}

export interface StitchingStartedEvent extends BaseEvent {
  event_type: "job.stitching_started";
}

export interface StitchingCompleteEvent extends BaseEvent {
  event_type: "job.stitching_complete";
}

export interface JobCompleteEvent extends BaseEvent {
  event_type: "job.complete";
  transcript: string;
  speaker_map: Record<string, string>;
  metadata: TranscriptMetadata;
}

export interface JobFailedEvent extends BaseEvent {
  event_type: "job.failed";
  error_code: "INVALID_AUDIO" | "TRANSCRIPTION_FAILED" | "STORAGE_ERROR" | "INTERNAL_ERROR";
  error_message: string;
}

export interface AgentDecisionEvent extends BaseEvent {
  event_type: "job.agent_decision";
  agent: string;
  decision: string;
  reason: string;
}

export interface ProgressHeartbeatEvent extends BaseEvent {
  event_type: "job.progress_heartbeat";
  progress_pct: number;
  chunks_done: number;
  total_chunks: number;
}

export type AnyEvent =
  | JobAcceptedEvent
  | AudioAnalyzedEvent
  | PlanCreatedEvent
  | ChunkingStartedEvent
  | ChunkingCompleteEvent
  | ChunkProcessingStartedEvent
  | ChunkTranscribedEvent
  | QualityCheckedEvent
  | ChunkRetryEvent
  | StitchingStartedEvent
  | StitchingCompleteEvent
  | JobCompleteEvent
  | JobFailedEvent
  | AgentDecisionEvent
  | ProgressHeartbeatEvent;

// ── HTTP response types ───────────────────────────────────────────────────────
export interface TranscribeResponse {
  job_id: string;
  status: "pending";
  websocket_url: string;
  poll_url: string;
  result_url: string;
  message: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  progress_pct: number;
  error_code?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface TranscriptMetadata {
  duration_seconds: number;
  chunk_count: number;
  processing_time_seconds?: number;
  [key: string]: unknown;
}

export interface JobResultResponse {
  job_id: string;
  status: "completed";
  transcript: string;
  speaker_map: Record<string, string>;
  metadata: TranscriptMetadata;
}

export interface ApiError {
  status: number;
  code?: string;
  message: string;
  retryAfter?: string | null;
  requestId?: string | null;
  detail?: Array<{ loc: string[]; msg: string; type: string }>;
}

// ── Upload options ────────────────────────────────────────────────────────────
export interface TranscribeOptions {
  languageHint?: string;
  numSpeakers?: number;
  webhookUrl?: string;
}

// ── Processing state for ProcessingScreen ────────────────────────────────────
export interface ProcessingState {
  progress: number;
  stage: string;
  chunkCount: number;
  chunksComplete: number;
  previewLines: string[];
  qualityScores: number[];
  audioInfo?: {
    durationSeconds: number;
    qualityWarnings: string[];
  };
}
