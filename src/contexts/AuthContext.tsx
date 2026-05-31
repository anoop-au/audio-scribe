import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({ session: null, loading: true, signOut: async () => {} });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout: if Supabase doesn't respond in 5s, stop loading to show the auth screen
    const timeoutId = setTimeout(() => {
      setLoading(current => {
        if (current) {
          console.warn("[auth] Supabase session fetch timed out after 5s");
          return false;
        }
        return false;
      });
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      clearTimeout(timeoutId);
      setSession(session);
      setLoading(false);
      
      // Clear sensitive fragments from URL
      if (window.location.hash && (window.location.hash.includes("access_token") || window.location.hash.includes("refresh_token"))) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeoutId);
      setSession(session);
      setLoading(false);

      // Clear sensitive fragments from URL
      if (window.location.hash && (window.location.hash.includes("access_token") || window.location.hash.includes("refresh_token"))) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
