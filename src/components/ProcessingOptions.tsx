import { Switch } from "@/components/ui/switch";
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
    <div className="space-y-4">
      <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">Quick Settings</p>
      <div className="flex items-center gap-3">
        <Switch
          id="translate"
          checked={options.translateToEnglish}
          onCheckedChange={(checked) =>
            onChange({ ...options, translateToEnglish: checked })
          }
          className="data-[state=checked]:bg-accent"
        />
        <Label htmlFor="translate" className="text-sm cursor-pointer">
          Translate to English
        </Label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-mono">Output Format</Label>
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

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-mono">Language Hint</Label>
          <Input
            placeholder="e.g., Malayalam, Spanish"
            value={options.languageHint}
            onChange={(e) => onChange({ ...options, languageHint: e.target.value })}
            className="bg-card/60 border-border/40 h-9 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
