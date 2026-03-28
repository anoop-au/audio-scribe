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
      {/* Output Format — orange aura */}
      <div className="glassmorphism-card glassmorphism-card--orange rounded-2xl px-5 py-5 space-y-3">
        <Label className="text-[10px] text-muted-foreground/60 font-mono tracking-[0.15em] uppercase block">Output Format</Label>
        <div className="flex rounded-xl bg-background/30 p-1 gap-0.5">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...options, outputFormat: opt.value as Options["outputFormat"] })}
              className={`
                flex-1 text-xs font-medium py-1.5 px-4 rounded-lg transition-all duration-300 whitespace-nowrap
                ${options.outputFormat === opt.value
                  ? "bg-gradient-to-r from-[rgba(255,106,0,0.9)] to-[rgba(255,45,146,0.9)] text-white shadow-[0_2px_12px_rgba(255,106,0,0.3)]"
                  : "text-muted-foreground/70 hover:text-foreground hover:bg-foreground/5"
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language Hint — purple aura */}
      <div className="glassmorphism-card glassmorphism-card--purple rounded-2xl px-5 py-5 space-y-2.5">
        <Label className="text-[10px] text-muted-foreground/60 font-mono tracking-[0.15em] uppercase">Language Hint</Label>
        <Input
          placeholder="e.g., Malayalam, Spanish"
          value={options.languageHint}
          onChange={(e) => onChange({ ...options, languageHint: e.target.value })}
          className="bg-white/5 border-border/40 h-9 text-sm px-4"
        />
      </div>
    </div>
  );
}
