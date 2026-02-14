import { useState } from "react";
import { Check, Copy, Download, Mail, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { TranscriptionResult } from "@/lib/mock";

interface ResultsScreenProps {
  result: TranscriptionResult;
  onReset: () => void;
}

const FORMAT_OPTIONS = ["TXT", "DOCX", "PDF", "JSON"] as const;

export default function ResultsScreen({ result, onReset }: ResultsScreenProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>("TXT");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.transcript);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([result.transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.filename.replace(/\.[^.]+$/, "")}.${selectedFormat.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded as ${selectedFormat}`);
  };

  const preview = result.transcript.slice(0, 500) + (result.transcript.length > 500 ? "..." : "");

  return (
    <div className="flex flex-col items-center gap-8 animate-fade-up">
      {/* Success Icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center animate-scale-check">
          <Check className="w-10 h-10 text-success" strokeWidth={3} />
        </div>
      </div>

      <h2 className="text-xl font-semibold">Transcription Complete</h2>

      {/* Metadata Card */}
      <div className="w-full glass-card rounded-2xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {[
            ["File", result.filename],
            ["Duration", result.duration],
            ["Language", result.language],
            ["Processing", result.processingTime],
            ["Words", result.wordCount.toLocaleString()],
          ].map(([label, value]) => (
            <div key={label as string}>
              <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
              <p className="font-medium truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transcript Preview */}
      <div className="w-full glass-card rounded-2xl p-5">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Preview</p>
        <div className="max-h-48 overflow-y-auto text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
          {preview}
        </div>
      </div>

      {/* Format pills */}
      <div className="flex gap-2">
        {FORMAT_OPTIONS.map((fmt) => (
          <button
            key={fmt}
            onClick={() => setSelectedFormat(fmt)}
            className={`
              px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200
              ${selectedFormat === fmt
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
              }
            `}
          >
            {fmt}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button onClick={handleDownload} className="flex-1 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base">
          <Download className="w-4 h-4" /> Download {selectedFormat}
        </Button>
        <Button variant="outline" onClick={handleCopy} className="gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => toast.info("Email feature coming soon")}>
          <Mail className="w-4 h-4" /> Email
        </Button>
      </div>

      {/* Reset */}
      <Button variant="ghost" onClick={onReset} className="gap-2 text-muted-foreground">
        <RotateCcw className="w-4 h-4" /> Process Another File
      </Button>
    </div>
  );
}
