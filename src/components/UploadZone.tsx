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

function AnimatedWaveform() {
  return (
    <svg
      viewBox="0 0 120 40"
      className="w-32 h-8 mx-auto mb-3 opacity-30"
      preserveAspectRatio="none"
    >
      {[
        { x: 8, delay: "0s", height: 14 },
        { x: 18, delay: "0.15s", height: 22 },
        { x: 28, delay: "0.3s", height: 30 },
        { x: 38, delay: "0.1s", height: 18 },
        { x: 48, delay: "0.4s", height: 26 },
        { x: 58, delay: "0.05s", height: 34 },
        { x: 68, delay: "0.25s", height: 20 },
        { x: 78, delay: "0.35s", height: 28 },
        { x: 88, delay: "0.2s", height: 16 },
        { x: 98, delay: "0.45s", height: 24 },
        { x: 108, delay: "0.12s", height: 12 },
      ].map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={20 - bar.height / 2}
          width="4"
          rx="2"
          fill="url(#waveGradient)"
          className="animate-waveform-bar"
          style={{
            animationDelay: bar.delay,
            height: bar.height,
            transformOrigin: `${bar.x + 2}px 20px`,
          }}
        />
      ))}
      <defs>
        <linearGradient id="waveGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff6a00" />
          <stop offset="50%" stopColor="#ff2d92" />
          <stop offset="100%" stopColor="#1e90ff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function UploadZone({ onFileSelect, selectedFile, onClear }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
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
            rounded-2xl cursor-pointer transition-all duration-300 origin-center
            ${isDragging
              ? "scale-[1.02] shadow-[0_0_40px_rgba(255,106,0,0.3),0_0_80px_rgba(255,45,146,0.15)]"
              : ""
            }
          `}
          style={{
            background: isDragging
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {/* Gradient border via pseudo-element inline approach */}
          <div
            className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 ${isDragging ? "opacity-100" : "opacity-60"}`}
            style={{
              padding: "1px",
              background: isDragging
                ? "linear-gradient(135deg, rgba(255,106,0,0.7) 0%, rgba(255,45,146,0.5) 50%, rgba(30,144,255,0.4) 100%)"
                : "linear-gradient(135deg, rgba(255,106,0,0.3) 0%, rgba(30,144,255,0.1) 50%, transparent 80%)",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              borderRadius: "inherit",
            }}
          />
          <input
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          <AnimatedWaveform />

          <div className={`
            p-4 rounded-2xl mb-4 transition-all duration-300
            ${isDragging ? "bg-accent/10 scale-110" : "bg-muted/60"}
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
