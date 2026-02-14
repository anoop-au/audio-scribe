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
    <div className="w-full animate-fade-up">
      {!selectedFile ? (
        <label
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`
            relative flex flex-col items-center justify-center w-full min-h-[240px] p-8
            rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300
            ${isDragging
              ? "border-accent bg-accent/5 glow-accent"
              : "border-border hover:border-accent/50 hover:bg-muted/50"
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
            ${isDragging ? "bg-accent/10" : "bg-muted"}
          `}>
            <Upload className={`w-8 h-8 transition-colors ${isDragging ? "text-accent" : "text-muted-foreground"}`} />
          </div>
          <p className="text-base font-medium mb-1">
            Drop your file here, or <span className="text-accent">browse</span>
          </p>
          <p className="text-sm text-muted-foreground">
            MP3, WAV, M4A, OGG, MP4, MOV, AVI
          </p>
        </label>
      ) : (
        <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-accent/10">
            {isAudio ? (
              <FileAudio className="w-6 h-6 text-accent" />
            ) : (
              <FileVideo className="w-6 h-6 text-accent" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
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
