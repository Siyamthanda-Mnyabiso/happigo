import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { routes } from '@/lib/routes';

/**
 * The signed-in partner and their restaurant. The one place that answers "who is this and which
 * restaurant is theirs", so pages and actions don't each repeat the lookup.
 */
export async function getPartner() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(routes.restaurant.signIn);
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, subscriptions(plan), bank_accounts(restaurant_id)')
    .eq('owner_id', data.user.id)
    .maybeSingle();
  return {
    supabase,
    user: data.user,
    restaurant,
    hasPlan: !!restaurant?.subscriptions,
    hasBank: !!restaurant?.bank_accounts,
  };
}

/** Like getPartner but guarantees a restaurant row exists (creates it on first onboarding step). */
export async function getOrCreateRestaurant() {
  const partner = await getPartner();
  if (partner.restaurant) return { ...partner, restaurantId: partner.restaurant.id };
  const { data, error } = await partner.supabase
    .from('restaurants')
    .insert({ owner_id: partner.user.id, name: 'New restaurant' })
    .select('id')
    .single();
  if (error) throw new Error('Could not create restaurant');
  return { ...partner, restaurantId: data.id };
}

/** The restaurant's main branch. Menu and store settings hang off it. null until the store is set up. */
export async function getMainBranch() {
  const partner = await getPartner();
  if (!partner.restaurant) redirect(routes.restaurant.planOnboarding);
  const { data: branch } = await partner.supabase
    .from('branches')
    .select('id, name, address, accepting_orders')
    .eq('restaurant_id', partner.restaurant.id)
    .order('created_at')
    .limit(1)
    .maybeSingle();
  return { ...partner, restaurant: partner.restaurant, branch };
}
