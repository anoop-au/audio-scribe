import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProcessingOptions as Options } from "@/lib/mock";

interface ProcessingOptionsProps {
  options: Options;
  onChange: (options: Options) => void;
}

export default function ProcessingOptions({ options, onChange }: ProcessingOptionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="glassmorphism-card rounded-2xl px-4 py-4 space-y-2">
        <Label className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase">Output Format</Label>
        <Select
          value={options.outputFormat}
          onValueChange={(v) =>
            onChange({ ...options, outputFormat: v as Options["outputFormat"] })
          }
        >
          <SelectTrigger className="bg-card/60 border-border/40 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="transcript">Full Transcript</SelectItem>
            <SelectItem value="summary">Summary</SelectItem>
            <SelectItem value="keypoints">Key Points</SelectItem>
            <SelectItem value="srt">Subtitle File (SRT)</SelectItem>
          </SelectContent>
        </Select>
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
