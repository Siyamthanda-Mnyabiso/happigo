import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from './auth';

/** Send signed-out visitors to sign in, and bring them back to this screen afterwards. */
export function useRequireAuth() {
  const auth = useAuth();
  const path = usePathname();
  useEffect(() => {
    if (!auth.loading && !auth.session) router.replace({ pathname: '/sign-in', params: { next: path } });
  }, [auth.loading, auth.session, path]);
  return auth;
}

/** Only same-app paths. Stops a crafted link from sending someone elsewhere after sign in. */
export function safeNext(next: string | string[] | undefined, fallback = '/'): string {
  const v = Array.isArray(next) ? next[0] : next;
  return v && v.startsWith('/') && !v.startsWith('//') && !v.includes('\\') ? v : fallback;
}
