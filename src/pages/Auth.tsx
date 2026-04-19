import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Wand2, Loader2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const { session, loading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { toast } = useToast();

  if (authLoading) return null;
  if (session) return <Navigate to="/" replace />;

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

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setGoogleLoading(false);
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
              style={{ backgroundImage: "linear-gradient(135deg, #ff6a00 0%, #ff2d92 50%, #1e90ff 100%)" }}
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

            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200 text-sm font-medium text-foreground mb-4"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.2 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.1C9.5 35.6 16.2 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.1 5.5l6.2 5.2C41.5 36.1 44 30.5 44 24c0-1.2-.1-2.3-.4-3.5z"/>
                </svg>
              )}
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

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
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-accent hover:underline font-medium">
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
