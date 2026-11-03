import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TabBar } from './tab-bar';

/** Sends partners who haven't finished onboarding back to the step they're missing. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/restaurant/sign-in');
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, subscriptions(plan), bank_accounts(restaurant_id)')
    .eq('owner_id', auth.user.id)
    .maybeSingle();
  if (!restaurant || !restaurant.subscriptions) redirect('/restaurant/onboarding/plan');
  if (!restaurant.bank_accounts) redirect('/restaurant/onboarding/bank');
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] px-6 pb-28 pt-6">
      {children}
      <TabBar />
    </div>
  );
}
