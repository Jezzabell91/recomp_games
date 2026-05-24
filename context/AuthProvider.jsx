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
      // maybeSingle (not single) so a missing row returns { data: null } instead
      // of throwing PGRST116. The "session exists but no profile" state can
      // happen if an admin wipes/reseeds users — the cached JWT in localStorage
      // still has the deleted user's UUID, and the cascade-delete on auth.users
      // takes the matching public.users row with it. We detect that case and
      // sign out so the next request to a gated route bounces them back to "/".
      const { data, error } = await supabase
        .from("users")
        .select("id, display_name, avatar_url, is_admin, color")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn("profile fetch failed:", error.message);
        setProfile(null);
        return;
      }
      if (data === null) {
        // Orphan session — auth.users row was deleted but the JWT is still
        // cached locally. Clear it and bounce to landing.
        console.warn("session has no matching public.users row; signing out");
        await supabase.auth.signOut();
        setProfile(null);
        return;
      }
      setProfile(data);
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
