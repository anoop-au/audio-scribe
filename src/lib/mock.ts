export interface FileInfo {
  name: string;
  size: number;
  type: string;
  estimatedDuration: string;
}

export interface ProcessingOptions {
  translateToEnglish?: boolean;
  outputFormat: "transcript" | "summary" | "keypoints" | "srt";
  languageHint: string;
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
  detail?: string;
  timing?: string;
}

export interface TranscriptionResult {
  filename: string;
  duration: string;
  language: string;
  processingTime: string;
  wordCount: number;
  transcript: string;
}

export const ACCEPTED_TYPES = [
  "audio/mpeg", "audio/wav", "audio/x-m4a", "audio/ogg",
  "video/mp4", "video/quicktime", "video/x-msvideo",
  "audio/mp4", "audio/x-wav", "video/avi",
];

export const ACCEPTED_EXTENSIONS = ".mp3,.wav,.m4a,.ogg,.mp4,.mov,.avi";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

export function estimateDuration(size: number): string {
  // Rough estimate: ~1MB per minute for audio
  const minutes = Math.max(1, Math.round(size / (1024 * 1024)));
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `~${hours}h ${mins}m`;
}

export const MOCK_TRANSCRIPT = `Welcome to today's discussion on artificial intelligence and its impact on modern workflows. We're going to explore how AI-powered transcription services have revolutionized the way professionals handle audio and video content.

First, let's talk about the fundamental challenge. Before automated transcription, organizations spent countless hours manually converting spoken words into text. This was not only time-consuming but also prone to human error, especially with technical terminology or accented speech.

The advent of machine learning models, particularly transformer-based architectures, has dramatically changed this landscape. Modern speech-to-text systems can process audio in real-time with accuracy rates exceeding 95% for clear speech in supported languages.

One of the key innovations has been the ability to handle multiple languages and dialects. Whether you're transcribing a business meeting in English, a lecture in Spanish, or a podcast in Japanese, these systems adapt and deliver remarkably accurate results.

The chunking approach — where longer audio files are split into manageable segments — has been instrumental in handling files of any length. Each chunk is processed independently and then intelligently merged, preserving context and continuity across segment boundaries.

Looking ahead, we expect to see even more sophisticated features: real-time speaker diarization, emotion detection, and automatic summarization will become standard capabilities. The future of audio transcription is incredibly exciting.

Thank you for joining us today. We hope this overview has been informative and helpful for your understanding of modern transcription technology.`;

export function createInitialSteps(chunkCount: number): ProcessingStep[] {
  return [
    { id: "analyze", label: "Analyzing file", status: "pending" },
    { id: "chunk", label: `Creating ${chunkCount} chunks`, status: "pending" },
    { id: "transcribe", label: "Transcribing chunks", status: "pending" },
    { id: "merge", label: "Merging results", status: "pending" },
    { id: "format", label: "Finalizing transcript", status: "pending" },
  ];
}
