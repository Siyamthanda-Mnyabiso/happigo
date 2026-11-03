import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@native/auth';
import { supabase } from '@native/supabase';

/** Our database functions raise plain-language messages with SQLSTATE 23514 on purpose. Show those, hide the rest. */
export function friendlyError(error: { code?: string; message: string }): string {
  return error.code === '23514' ? error.message : 'Something went wrong. Try again.';
}

export type DriverProfile = {
  phone: string | null;
  vehicle_type: string | null;
  vehicle_model: string | null;
  vehicle_plate: string | null;
  is_online: boolean;
};

/**
 * The signed-in driver. Signed-out visitors, and accounts that are not drivers, go to sign in.
 * `driver` is null until the profile has loaded.
 */
export function useDriver() {
  const auth = useAuth();
  const uid = auth.session?.user.id;
  const q = useQuery({
    queryKey: ['driver', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('phone, vehicle_type, vehicle_model, vehicle_plate, is_online')
        .eq('user_id', uid!)
        .maybeSingle();
      if (error) throw error;
      return data as DriverProfile | null;
    },
  });
  const notDriver = q.isSuccess && !q.data;
  useEffect(() => {
    if (auth.loading) return;
    if (!auth.session) router.replace('/sign-in');
    else if (notDriver) supabase.auth.signOut().then(() => router.replace('/sign-in'));
  }, [auth.loading, auth.session, notDriver]);
  return {
    uid,
    driver: q.data ?? null,
    name: auth.fullName ?? 'Driver',
    email: auth.session?.user.email ?? null,
    refetch: q.refetch,
    ready: !!uid && !!q.data,
  };
}
