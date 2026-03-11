import { useState } from "react";
import { Check, Copy, Download, Share2, RotateCcw, FileText, Clock, Globe, Hash, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { TranscriptionResult } from "@/lib/mock";

interface ResultsScreenProps {
  result: TranscriptionResult;
  onReset: () => void;
}

const FORMAT_OPTIONS = ["TXT", "DOCX", "PDF", "JSON"] as const;

// Stagger orchestration
const stagger = {
  container: { transition: { staggerChildren: 0.15 } },
};
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: EASE } },
});
const slideRight = (delay = 0) => ({
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.45, delay, ease: EASE } },
});
const slideUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: EASE } },
});

// Confidence mini ring
function ConfidenceRing({ value }: { value: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width="48" height="48" className="-rotate-90">
      <circle cx="24" cy="24" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" opacity="0.3" />
      <motion.circle
        cx="24" cy="24" r={r} fill="none"
        stroke="#ff6a00" strokeWidth="4" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
        style={{ filter: "drop-shadow(0 0 4px rgba(255, 106, 0, 0.5))" }}
      />
      <text
        x="24" y="24"
        textAnchor="middle" dominantBaseline="central"
        className="fill-foreground text-[10px] font-mono font-bold"
        transform="rotate(90 24 24)"
      >
        {value}%
      </text>
    </svg>
  );
}

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

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Transcription", text: result.transcript.slice(0, 300) });
    } else {
      toast.info("Share not supported — text copied instead");
      await navigator.clipboard.writeText(result.transcript);
    }
  };

  const metrics = [
    { icon: FileText, label: "File", value: result.filename, color: "text-accent" },
    { icon: Clock, label: "Duration", value: result.duration, color: "text-accent" },
    { icon: Globe, label: "Language", value: result.language, color: "text-accent" },
    { icon: Hash, label: "Words", value: result.wordCount.toLocaleString(), color: "text-accent" },
  ];

  return (
    <motion.div
      variants={stagger.container}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center gap-6 sm:gap-8 pb-28 relative"
    >
      {/* Step 1: Success Icon — Draw animation with radial glow */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        className="relative"
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0 blur-2xl opacity-40 rounded-full scale-150"
          style={{
            background: "radial-gradient(circle, rgba(255,106,0,0.5) 0%, rgba(255,45,146,0.3) 50%, transparent 80%)",
          }}
        />
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center relative z-10"
          style={{
            background: "linear-gradient(135deg, rgba(255,106,0,0.15), rgba(255,45,146,0.15))",
            border: "1px solid rgba(255,106,0,0.3)",
            boxShadow: "0 0 30px rgba(255,106,0,0.2), 0 0 60px rgba(255,45,146,0.1)",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <motion.path
              d="M10 20 L17 27 L30 13"
              stroke="#ff6a00"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              style={{ filter: "drop-shadow(0 0 6px rgba(255,106,0,0.6))" }}
            />
          </svg>
        </div>
      </motion.div>

      {/* Sub-header */}
      <motion.div {...fadeUp(0.3)} className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold">Transcription Complete</h2>
        <p className="text-sm font-mono text-muted-foreground">
          Completed in <span className="text-accent">{result.processingTime}</span>
        </p>
      </motion.div>

      {/* Step 2: Intelligence Chips — Metadata grid */}
      <motion.div {...slideRight(0.45)} className="w-full grid grid-cols-1 sm:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="glassmorphism-card rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <m.icon className={`w-4 h-4 ${m.color} shrink-0`} />
            <div className="min-w-0">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{m.label}</p>
              <p className="text-sm font-semibold truncate">{m.value}</p>
            </div>
          </div>
        ))}
        {/* Confidence chip with mini ring */}
        <div className="glassmorphism-card rounded-xl px-4 py-3 flex items-center gap-3 sm:col-span-4">
          <Target className="w-4 h-4 text-accent shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Confidence</p>
            <p className="text-sm font-semibold">High Accuracy</p>
          </div>
          <ConfidenceRing value={98} />
        </div>
      </motion.div>

      {/* Step 3: Transcription Canvas */}
      <motion.div {...fadeUp(0.6)} className="w-full">
        <div
          className="glassmorphism-card rounded-2xl p-5 relative overflow-hidden"
        >
          {/* Inner shadow indicators */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 z-10 bg-gradient-to-b from-card/80 to-transparent rounded-t-2xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 z-10 bg-gradient-to-t from-card/80 to-transparent rounded-b-2xl" />

          <div
            className="max-h-64 overflow-y-auto text-sm leading-relaxed tracking-tight text-foreground/85 whitespace-pre-line pr-2"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,106,0,0.3) transparent",
            }}
          >
            {result.transcript}
          </div>
        </div>
      </motion.div>

      {/* Format pills */}
      <motion.div {...fadeUp(0.7)} className="flex gap-2">
        {FORMAT_OPTIONS.map((fmt) => (
          <button
            key={fmt}
            onClick={() => setSelectedFormat(fmt)}
            className={`
              px-4 py-1.5 rounded-full text-xs font-mono font-medium transition-all duration-200
              ${selectedFormat === fmt
                ? "text-accent-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
              }
            `}
            style={selectedFormat === fmt ? {
              background: "linear-gradient(135deg, rgba(255,106,0,0.2), rgba(255,45,146,0.2))",
              border: "1px solid rgba(255,106,0,0.4)",
              boxShadow: "0 0 12px rgba(255,106,0,0.15)",
            } : { border: "1px solid transparent" }}
          >
            {fmt}
          </button>
        ))}
      </motion.div>

      {/* Step 4: Sticky Action Dock */}
      <motion.div
        {...slideUp(0.8)}
        className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
      >
        <div className="max-w-2xl mx-auto px-4 pb-4 pointer-events-auto">
          <div
            className="rounded-2xl p-3 flex flex-col sm:flex-row gap-2"
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Primary: Download */}
            <Button
              onClick={handleDownload}
              className="flex-1 gap-2 h-11 text-sm font-bold text-white border-0 hover:brightness-110 active:scale-[0.98] transition-all"
              style={{
                background: "linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)",
                boxShadow: "0 4px 16px rgba(0,212,255,0.3)",
              }}
            >
              <Download className="w-4 h-4" /> Download {selectedFormat}
            </Button>

            {/* Secondary: Copy */}
            <Button
              variant="outline"
              onClick={handleCopy}
              className="gap-2 h-11 font-mono text-xs transition-all duration-200"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {copied ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <Check className="w-4 h-4 text-success" />
                  </motion.div>
                  <span className="text-success">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy
                </>
              )}
            </Button>

            {/* Secondary: Share */}
            <Button
              variant="outline"
              onClick={handleShare}
              className="gap-2 h-11 font-mono text-xs"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>

          {/* Step 5: Recovery — Start New */}
          <div className="flex justify-center mt-3">
            <motion.button
              whileHover={{
                boxShadow: "0 0 20px rgba(255,255,255,0.15)",
                borderColor: "rgba(255,255,255,0.4)",
              }}
              onClick={onReset}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-mono text-muted-foreground transition-all duration-300"
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Start New Transcription
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
