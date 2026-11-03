'use server';

import { redirect } from 'next/navigation';
import { getOrCreateRestaurant } from '@/lib/restaurant';
import { isPlanId } from '@/lib/plans';
import { routes } from '@/lib/routes';

export async function savePlan(formData: FormData) {
  const plan = formData.get('plan');
  if (!isPlanId(plan)) redirect(routes.restaurant.planOnboarding);
  const { supabase, restaurantId } = await getOrCreateRestaurant();
  const { error } = await supabase
    .from('subscriptions')
    .upsert({ restaurant_id: restaurantId, plan });
  if (error) throw new Error('Could not save plan');
  redirect(routes.restaurant.bankOnboarding);
}
