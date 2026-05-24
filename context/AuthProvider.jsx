import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { consumeLoginFragmentIfPresent } from "../lib/auth";

const AuthContext = createContext({ session: null, profile: null, loading: true });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await consumeLoginFragmentIfPresent();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session ?? null);
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("users")
        .select("id, display_name, avatar_url, is_admin")
        .eq("id", session.user.id)
        .single();
      if (!cancelled) setProfile(data ?? null);
    })();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  return (
    <AuthContext.Provider value={{ session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
