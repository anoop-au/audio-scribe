import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Wand2, Loader2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (isSignUp) {
      toast({ title: "Check your email", description: "We sent you a confirmation link." });
    }
  };

  return (
    <div className="min-h-screen gradient-bg grid-pattern">
      <div className="relative z-10 max-w-md mx-auto px-4 py-12 sm:py-20">
        <header className="text-center mb-10 relative">
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-mono font-medium mb-4">
            <Wand2 className="w-3 h-3" />
            AI-Powered Transcription
          </div>
          <motion.h1
            className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-2"
            initial={{ opacity: 0.5, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #ff6a00 0%, #ff2d92 50%, #1e90ff 100%)",
              }}
            >
              Aurascript
            </span>
          </motion.h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Sign in to start transcribing
          </p>
        </header>

        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <div className="glassmorphism-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {isSignUp ? "Create an account" : "Welcome back"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 px-4"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white/5 border-white/10 px-4"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-bold text-white hover:brightness-110 active:scale-[0.98] transition-all duration-200 border-0"
                style={{
                  background: "linear-gradient(135deg, #ff6a00 0%, #ff2d92 100%)",
                  boxShadow: "0 4px 16px rgba(255, 106, 0, 0.3)",
                }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-4">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-accent hover:underline font-medium"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>

        <footer className="text-center mt-10 space-y-1">
          <p className="text-[11px] text-muted-foreground/50 font-mono tracking-wide">
            Your files are processed securely and never stored
          </p>
          <p className="text-[9px] text-muted-foreground/30 tracking-[0.2em] uppercase">
            With love from Anoop
          </p>
        </footer>
      </div>
    </div>
  );
}
