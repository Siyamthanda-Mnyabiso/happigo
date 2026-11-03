import 'server-only';
import { cache } from 'react';
import { createClient } from './supabase/server';

/** Who is looking at the customer pages. Cached so the header and the page ask once per request. */
export const getViewer = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', data.user.id)
    .maybeSingle();
  return { role: profile?.role ?? null, firstName: profile?.full_name?.split(' ')[0] ?? null };
});
