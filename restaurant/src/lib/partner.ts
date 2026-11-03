import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@native/auth';
import { supabase } from '@native/supabase';

export function friendlyError(error: { code?: string; message: string }): string {
  return error.code === '23514' ? error.message : 'Something went wrong. Try again.';
}

export type Partner = {
  restaurant: {
    id: string;
    name: string;
    cuisine: string | null;
    image_url: string | null;
    delivery_fee_cents: number;
    plan: 'smb' | 'enterprise' | null;
    hasBank: boolean;
  };
  branch: { id: string; address: string | null; accepting_orders: boolean } | null;
};

/**
 * The signed-in partner and their restaurant. Signed-out visitors, and accounts that are not
 * restaurant partners, go to sign in. With `onboarded`, partners who still owe a plan or bank
 * account go to that step first.
 */
export function usePartner(opts: { onboarded?: boolean } = {}) {
  const auth = useAuth();
  const uid = auth.session?.user.id;
  const q = useQuery({
    queryKey: ['partner', uid],
    enabled: !!uid,
    queryFn: async (): Promise<Partner | null> => {
      const { data: r, error } = await supabase
        .from('restaurants')
        .select('id, name, cuisine, image_url, delivery_fee_cents, subscriptions(plan), bank_accounts(restaurant_id)')
        .eq('owner_id', uid!)
        .maybeSingle();
      if (error) throw error;
      if (!r) return { restaurant: null, branch: null } as unknown as Partner;
      const { data: branch } = await supabase
        .from('branches')
        .select('id, address, accepting_orders')
        .eq('restaurant_id', r.id)
        .order('created_at')
        .limit(1)
        .maybeSingle();
      return {
        restaurant: {
          id: r.id,
          name: r.name,
          cuisine: r.cuisine,
          image_url: r.image_url,
          delivery_fee_cents: r.delivery_fee_cents,
          plan: r.subscriptions?.plan ?? null,
          hasBank: !!r.bank_accounts,
        },
        branch,
      };
    },
  });

  const wrongRole = !!auth.role && auth.role !== 'restaurant';
  const p = q.data;
  const hasRestaurant = !!p && !!(p as { restaurant: unknown }).restaurant;
  useEffect(() => {
    if (auth.loading) return;
    if (!auth.session) return void router.replace('/sign-in');
    if (wrongRole) return void supabase.auth.signOut().then(() => router.replace('/sign-in'));
    if (opts.onboarded && q.isSuccess) {
      if (!hasRestaurant || !p!.restaurant.plan) router.replace('/onboarding/plan');
      else if (!p!.restaurant.hasBank) router.replace('/onboarding/bank');
    }
  }, [auth.loading, auth.session, wrongRole, opts.onboarded, q.isSuccess, hasRestaurant, p]);

  return {
    uid,
    partner: hasRestaurant ? p! : null,
    loaded: q.isSuccess,
    refetch: q.refetch,
    ready: !!uid && q.isSuccess && hasRestaurant && !wrongRole,
  };
}
