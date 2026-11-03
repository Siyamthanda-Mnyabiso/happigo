import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

type AuthState = {
  session: Session | null;
  /** True until the stored session has been read, so screens don't flash "signed out". */
  loading: boolean;
  firstName: string | null;
  fullName: string | null;
  role: string | null;
};

const Ctx = createContext<AuthState>({ session: null, loading: true, firstName: null, fullName: null, role: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ uid: string; full_name: string | null; role: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const uid = session?.user.id;
  useEffect(() => {
    if (!uid) return;
    supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', uid)
      .maybeSingle()
      .then(({ data }) => setProfile(data ? { uid, ...data } : null));
  }, [uid]);
  // A profile fetched for someone who has since signed out must not show for the next person.
  const mine = profile && profile.uid === uid ? profile : null;

  const value = useMemo<AuthState>(
    () => ({
      session,
      loading,
      fullName: mine?.full_name ?? null,
      firstName: mine?.full_name?.split(' ')[0] ?? null,
      role: mine?.role ?? null,
    }),
    [session, loading, mine],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
