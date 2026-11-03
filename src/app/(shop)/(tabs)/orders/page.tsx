import Link from 'next/link';
import { AutoRefresh } from '@/components/auto-refresh';
import { FoodPhoto } from '@/components/food-photo';
import { getCustomer } from '@/lib/customer';
import { STATUS_COPY, isActive } from '@/lib/customer-status';
import { formatRand } from '@/lib/money';
import { routes } from '@/lib/routes';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const tab = (await searchParams).tab === 'past' ? 'past' : 'active';
  const { supabase } = await getCustomer(routes.customer.orders);
  const { data: orders } = await supabase
    .from('orders')
    .select(
      'id, status, total_cents, tip_cents, created_at, delivered_at, branches(restaurants(name, cuisine, image_url)), order_items(quantity)',
    )
    .order('created_at', { ascending: false })
    .limit(50);
  const mine = orders ?? [];
  const shown = mine.filter((o) => isActive(o.status) === (tab === 'active'));
  const pill = (on: boolean) =>
    `inline-flex h-11 items-center rounded-full border-[1.5px] px-6 font-semibold ${on ? 'border-brand bg-brand text-white' : 'border-line'}`;

  return (
    <>
      {tab === 'active' && shown.length > 0 && <AutoRefresh seconds={15} />}
      <h1 className="text-[28px] font-extrabold">My orders</h1>
      <nav aria-label="Order lists" className="mt-4 flex gap-3">
        <Link
          href={routes.customer.orders}
          aria-current={tab === 'active' ? 'page' : undefined}
          className={pill(tab === 'active')}
        >
          Active
        </Link>
        <Link
          href={`${routes.customer.orders}?tab=past`}
          aria-current={tab === 'past' ? 'page' : undefined}
          className={pill(tab === 'past')}
        >
          Past
        </Link>
      </nav>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-[22px] bg-card p-6 text-center">
          <p className="font-bold">
            {tab === 'active' ? 'No orders in progress' : 'No past orders yet'}
          </p>
          <p className="mb-3 text-muted">Hungry? Find something to eat.</p>
          <Link href={routes.customer.home} className="font-semibold text-brand">
            Browse restaurants
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {shown.map((o) => {
            const r = o.branches?.restaurants;
            const items = o.order_items.reduce((n, i) => n + i.quantity, 0);
            const active = isActive(o.status);
            const day = new Date(o.delivered_at ?? o.created_at).toLocaleDateString('en-ZA', {
              day: 'numeric',
              month: 'short',
            });
            return (
              <li key={o.id} className="rounded-3xl border-[1.5px] border-line p-4">
                <div className="flex gap-3">
                  <span className="relative block size-[68px] shrink-0 overflow-hidden rounded-2xl">
                    <FoodPhoto
                      src={r?.image_url ?? null}
                      hint={r?.cuisine ?? r?.name ?? null}
                      seed={r?.name ?? o.id}
                      sizes="68px"
                      emojiClass="text-3xl"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[17px] font-bold">{r?.name ?? 'Restaurant'}</p>
                    <p className="text-muted">
                      {items} {items === 1 ? 'item' : 'items'} ·{' '}
                      {formatRand((o.total_cents ?? 0) + o.tip_cents)}
                    </p>
                    {active ? (
                      <span className="mt-1 inline-block rounded-full bg-ok-bg px-3 py-0.5 text-base font-medium text-ok">
                        {STATUS_COPY[o.status].short}
                      </span>
                    ) : (
                      <p className="text-muted">
                        {STATUS_COPY[o.status].short} {o.status === 'delivered' ? day : ''}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href={routes.customer.order(o.id)}
                  className={`mt-4 flex h-12 items-center justify-center rounded-full font-semibold ${
                    active
                      ? 'bg-brand text-white shadow-[0_6px_8px_rgba(247,59,3,0.25)]'
                      : 'border-[1.5px] border-line'
                  }`}
                >
                  {active ? 'Track order' : 'View order'}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
