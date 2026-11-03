'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isPlanId } from '@/lib/plans';

export async function savePlan(formData: FormData) {
  const plan = formData.get('plan');
  if (!isPlanId(plan)) redirect('/restaurant/onboarding/plan');
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/restaurant/sign-in');

  let { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', auth.user.id)
    .maybeSingle();
  if (!restaurant) {
    const created = await supabase
      .from('restaurants')
      .insert({ owner_id: auth.user.id, name: 'New restaurant' })
      .select('id')
      .single();
    if (created.error) throw new Error('Could not create restaurant');
    restaurant = created.data;
  }
  const { error } = await supabase
    .from('subscriptions')
    .upsert({ restaurant_id: restaurant.id, plan });
  if (error) throw new Error('Could not save plan');
  redirect('/restaurant/onboarding/bank');
}
