import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AuthError, Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: "admin" | "user" | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; role: "admin" | "user" | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async (uid: string): Promise<"admin" | "user"> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid);
    return data?.some((r) => r.role === "admin") ? "admin" : "user";
  }, []);

  const loadRole = useCallback(async (uid: string) => {
    setRole(await fetchRole(uid));
  }, [fetchRole]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadRole(s.user.id), 0);
      } else {
        setRole(null);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!s?.user) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      // getSession() only decodes the locally-cached JWT — it doesn't confirm
      // the user still exists server-side. A session cached before a local
      // `supabase db reset` (or a deleted account) would otherwise look valid
      // right up until a write hits a foreign key on a wiped user id. Verify
      // against the server before trusting it.
      const { error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }
      setSession(s);
      setUser(s.user);
      await loadRole(s.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadRole]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error, role: null };
    const userRole = await fetchRole(data.user.id);
    setRole(userRole);
    return { error: null, role: userRole };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
