import 'server-only';
import type { PostgrestError } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';

/** The signed-in driver and their profile. Anyone who isn't a driver is sent back to sign in. */
export async function getDriver() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(routes.driver.signIn);
  const [{ data: driver }, { data: profile }] = await Promise.all([
    supabase
      .from('driver_profiles')
      .select('phone, vehicle_type, vehicle_model, vehicle_plate, is_online')
      .eq('user_id', data.user.id)
      .maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', data.user.id).maybeSingle(),
  ]);
  if (!driver) redirect(routes.driver.signIn);
  return { supabase, user: data.user, driver, name: profile?.full_name ?? 'Driver' };
}

/**
 * Our database functions raise plain-language messages with SQLSTATE 23514 on purpose
 * ("Someone else already took this delivery"). Show those. Hide everything else.
 */
export function friendlyError(error: PostgrestError): string {
  return error.code === '23514' ? error.message : 'Something went wrong. Try again.';
}
