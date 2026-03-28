import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProcessingOptions as Options } from "@/lib/mock";

const FORMAT_OPTIONS = [
  { value: "transcript", label: "Full" },
  { value: "summary", label: "Summary" },
  { value: "keypoints", label: "Key Points" },
  { value: "srt", label: "SRT" },
] as const;

interface ProcessingOptionsProps {
  options: Options;
  onChange: (options: Options) => void;
}

export default function ProcessingOptions({ options, onChange }: ProcessingOptionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="glassmorphism-card rounded-2xl px-4 py-4 space-y-2">
        <Label className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase">Output Format</Label>
        <div className="flex rounded-xl bg-background/30 p-1 gap-0.5">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...options, outputFormat: opt.value as Options["outputFormat"] })}
              className={`
                flex-1 text-xs font-medium py-1.5 px-2 rounded-lg transition-all duration-300 whitespace-nowrap
                ${options.outputFormat === opt.value
                  ? "bg-gradient-to-r from-[rgba(255,106,0,0.9)] to-[rgba(255,45,146,0.9)] text-white shadow-[0_2px_12px_rgba(255,106,0,0.3)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glassmorphism-card rounded-2xl px-4 py-4 space-y-2">
        <Label className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase">Language Hint</Label>
        <Input
          placeholder="e.g., Malayalam, Spanish"
          value={options.languageHint}
          onChange={(e) => onChange({ ...options, languageHint: e.target.value })}
          className="bg-card/60 border-border/40 h-9 text-sm"
        />
      </div>
    </div>
  );
}
