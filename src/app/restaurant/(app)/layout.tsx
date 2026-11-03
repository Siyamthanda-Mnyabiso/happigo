import { redirect } from 'next/navigation';
import { getPartner } from '@/lib/restaurant';
import { routes } from '@/lib/routes';
import { TabBar } from './tab-bar';

/** Sends partners who haven't finished onboarding back to the step they're missing. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { hasPlan, hasBank } = await getPartner();
  if (!hasPlan) redirect(routes.restaurant.planOnboarding);
  if (!hasBank) redirect(routes.restaurant.bankOnboarding);
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] px-6 pb-28 pt-6">
      {children}
      <TabBar />
    </div>
  );
}
