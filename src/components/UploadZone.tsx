import { useCallback, useState } from "react";
import { Upload, FileAudio, FileVideo, X } from "lucide-react";
import { ACCEPTED_EXTENSIONS, formatFileSize, estimateDuration, type FileInfo } from "@/lib/mock";

interface UploadZoneProps {
  onFileSelect: (file: File, info: FileInfo) => void;
  selectedFile: FileInfo | null;
  onClear: () => void;
}

export default function UploadZone({ onFileSelect, selectedFile, onClear }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
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
            rounded-2xl border cursor-pointer transition-all duration-300
            ${isDragging
              ? "border-accent bg-accent/5 shadow-[0_0_24px_-4px_hsl(var(--accent)/0.3),inset_0_0_20px_0_hsl(var(--accent)/0.06)]"
              : "border-accent/20 hover:border-accent/60 hover:shadow-[0_0_16px_-4px_hsl(var(--accent)/0.15)] bg-card/40"
            }
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
          <p className="text-xs text-muted-foreground font-mono tracking-wide">
            MP3 · WAV · M4A · OGG · MP4 · MOV · AVI
          </p>
        </label>
      ) : (
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4 animate-slide-fade-in">
          <div className="p-3 rounded-xl bg-accent/10">
            {isAudio ? (
              <FileAudio className="w-5 h-5 text-accent" />
            ) : (
              <FileVideo className="w-5 h-5 text-accent" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {formatFileSize(selectedFile.size)} · {selectedFile.estimatedDuration}
            </p>
          </div>
          <button
            onClick={onClear}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
