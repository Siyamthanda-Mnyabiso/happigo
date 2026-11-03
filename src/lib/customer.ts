import 'server-only';
import { redirect } from 'next/navigation';
import { routes } from './routes';
import { createClient } from './supabase/server';

/** The signed-in customer. Anyone else is sent to sign in and brought back to `next` afterwards. */
export async function getCustomer(next: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`${routes.customer.signIn}?next=${encodeURIComponent(next)}`);
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profile?.role !== 'customer')
    redirect(`${routes.customer.signIn}?next=${encodeURIComponent(next)}`);
  return { supabase, user: data.user, name: profile.full_name ?? 'Customer' };
}
