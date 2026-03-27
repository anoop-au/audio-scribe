import { useCallback, useState } from "react";
import { Upload, FileAudio, FileVideo, X } from "lucide-react";
import { formatFileSize, estimateDuration, type FileInfo } from "@/lib/mock";
import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME_TYPES, MAX_FILE_BYTES } from "@/lib/api";
import { toast } from "sonner";

interface UploadZoneProps {
  onFileSelect: (file: File, info: FileInfo) => void;
  selectedFile: FileInfo | null;
  onClear: () => void;
}

export default function UploadZone({ onFileSelect, selectedFile, onClear }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    // Client-side validation
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File exceeds 700 MB limit.");
      return;
    }
    if (!ACCEPTED_MIME_TYPES.includes(file.type) && file.type !== "") {
      toast.error("Unsupported file type. Please use MP3, WAV, M4A, OGG, FLAC, AAC, WebM, or MP4.");
      return;
    }

    const info: FileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      estimatedDuration: estimateDuration(file.size),
    };
    onFileSelect(file, info);
  }, [onFileSelect]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const isAudio = selectedFile?.type.startsWith("audio");

  return (
    <div className="w-full">
      {!selectedFile ? (
        <label
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`
            relative flex flex-col items-center justify-center w-full min-h-[220px] p-8
            rounded-2xl cursor-pointer transition-all duration-300 glassmorphism-card
            ${isDragging ? "glassmorphism-card-active" : ""}
          `}
        >
          <input
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div className={`
            p-4 rounded-2xl mb-4 transition-all duration-300
            ${isDragging ? "bg-accent/10" : "bg-muted/60"}
          `}>
            <Upload className={`w-8 h-8 animate-icon-pulse transition-colors ${isDragging ? "text-accent" : "text-muted-foreground"}`} />
          </div>
          <p className="text-base font-semibold mb-1">
            Drop your file here, or <span className="text-accent">browse</span>
          </p>
          <p className="text-xs text-muted-foreground/70 font-mono" style={{ letterSpacing: '1px' }}>
            MP3 · WAV · M4A · OGG · FLAC · AAC · WEBM · MP4
          </p>
        </label>
      ) : (
        <div className="glassmorphism-card rounded-2xl p-5 flex items-center gap-4 animate-slide-fade-in">
          <div className="p-3 rounded-xl bg-accent/10">
            {isAudio ? (
              <FileAudio className="w-5 h-5 text-accent" />
            ) : (
              <FileVideo className="w-5 h-5 text-accent" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{selectedFile.name}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 text-[11px] font-mono font-medium text-accent tracking-wide">
                {formatFileSize(selectedFile.size)} <span className="text-accent/40">|</span> <span className="uppercase">{selectedFile.name.split('.').pop()}</span> <span className="text-accent/40">|</span> {selectedFile.estimatedDuration}
              </span>
            </div>
          </div>
          <button
            onClick={onClear}
            className="p-2.5 rounded-lg hover:bg-destructive/10 transition-all duration-200 text-muted-foreground hover:text-destructive active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
