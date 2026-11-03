import { redirect } from 'next/navigation';
import { AutoRefresh } from '@/components/auto-refresh';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/layout';
import { getDriver } from '@/lib/driver';
import { routes } from '@/lib/routes';
import { setOnline } from '../../actions';
import { OfferCard, type Offer } from './offer-card';

export default async function DriverHomePage() {
  const { supabase, user, driver, name } = await getDriver();

  // A driver with a delivery in progress goes straight back to it.
  const { data: active } = await supabase
    .from('orders')
    .select('id')
    .eq('driver_id', user.id)
    .in('status', ['preparing', 'ready', 'picked_up'])
    .limit(1)
    .maybeSingle();
  if (active) redirect(routes.driver.delivery(active.id));

  if (!driver.is_online) {
    return (
      <>
        <h1 className="mb-6 text-lg font-bold">{name}</h1>
        <h2 className="text-3xl font-extrabold">You&apos;re offline</h2>
        <p className="mb-6 text-muted">Go online to start receiving orders.</p>
        <form action={setOnline}>
          <input type="hidden" name="online" value="true" />
          <Button type="submit">Go online</Button>
        </form>
      </>
    );
  }

  const { data: offers } = await supabase.rpc('driver_available_deliveries');
  const list: Offer[] = offers ?? [];

  return (
    <>
      <AutoRefresh seconds={10} />
      <h1 className="mb-6 text-lg font-bold">{name}</h1>
      <h2 className="text-3xl font-extrabold">Finding orders</h2>
      <p className="mb-6 text-muted">You&apos;re online. New deliveries show up here.</p>
      {!list.length ? (
        <Card tone="fill" className="text-muted">
          No deliveries right now. Stay on this screen and they appear as restaurants accept orders.
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((o) => (
            <li key={o.order_id}>
              <OfferCard offer={o} />
            </li>
          ))}
        </ul>
      )}
      <form action={setOnline} className="mt-8">
        <input type="hidden" name="online" value="false" />
        <Button type="submit" variant="secondary">
          Go offline
        </Button>
      </form>
    </>
  );
}
