import Link from 'next/link';
import { Card } from '@/components/ui/layout';
import { toRandInput } from '@/lib/money';
import { getMainBranch } from '@/lib/restaurant';
import { routes } from '@/lib/routes';
import { StoreForm } from './store-form';

export default async function StorePage() {
  const { supabase, restaurant, branch } = await getMainBranch();
  const { data: r } = await supabase
    .from('restaurants')
    .select('name, cuisine, delivery_fee_cents')
    .eq('id', restaurant.id)
    .single();
  return (
    <>
      <h1 className="mb-4 text-3xl font-extrabold">Store</h1>
      {!branch && (
        <Card tone="fill" className="mb-6">
          <p className="font-bold">Finish setting up your store</p>
          <p className="text-muted">
            Add your address and save. Customers can find you once you do.
          </p>
        </Card>
      )}
      <StoreForm
        name={r?.name === 'New restaurant' ? '' : (r?.name ?? '')}
        cuisine={r?.cuisine ?? ''}
        address={branch?.address ?? ''}
        deliveryFee={toRandInput(r?.delivery_fee_cents ?? 1500)}
        accepting={branch?.accepting_orders ?? false}
      />
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {[
          ['Subscription', routes.restaurant.subscription],
          ['Menu', routes.restaurant.menu],
        ].map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="flex h-14 items-center justify-between font-medium">
              {label} <span aria-hidden>›</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
