import { Checkbox } from "@/components/ui/checkbox";
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
    <div className="space-y-5 animate-fade-up" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center gap-3">
        <Checkbox
          id="translate"
          checked={options.translateToEnglish}
          onCheckedChange={(checked) =>
            onChange({ ...options, translateToEnglish: !!checked })
          }
        />
        <Label htmlFor="translate" className="text-sm cursor-pointer">
          Translate to English
        </Label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Output Format</Label>
          <Select
            value={options.outputFormat}
            onValueChange={(v) =>
              onChange({ ...options, outputFormat: v as Options["outputFormat"] })
            }
          >
            <SelectTrigger className="bg-card">
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

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Language Hint (optional)</Label>
          <Input
            placeholder="e.g., Malayalam, Spanish"
            value={options.languageHint}
            onChange={(e) => onChange({ ...options, languageHint: e.target.value })}
            className="bg-card"
          />
        </div>
      </div>
    </div>
  );
}
