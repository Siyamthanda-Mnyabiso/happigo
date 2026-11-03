import 'server-only';
import { redirect } from 'next/navigation';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';

/** The signed-in admin. Anyone who is not HappiGo staff is sent to the admin sign in. */
export async function getAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(routes.admin.signIn);
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect(routes.admin.signIn);
  return { supabase, user: data.user };
}
