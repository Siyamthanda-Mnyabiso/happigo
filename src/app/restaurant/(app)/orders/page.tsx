import Link from 'next/link';
import { clsx } from 'clsx';
import { Card } from '@/components/ui/layout';
import { formatRand } from '@/lib/money';
import { currentTime } from '@/lib/now';
import { ageLabel, itemCountLabel, minutesToReady, orderCode, parseTab, TABS } from '@/lib/orders';
import { getPartner } from '@/lib/restaurant';
import { routes } from '@/lib/routes';
import { AutoRefresh } from '@/components/auto-refresh';
import { ReadyAction, RespondActions } from './order-actions';

const EMPTY: Record<string, string> = {
  new: 'No new orders. They show up here the moment a customer orders.',
  preparing: 'Nothing in the kitchen right now.',
  ready: 'No orders waiting for a driver.',
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const tab = parseTab((await searchParams).tab);
  const { supabase, restaurant } = await getPartner();
  const { data: orders } = await supabase
    .from('orders')
    .select(
      'id, status, food_cents, created_at, customer_name, prep_minutes, accepted_at, order_items(name, quantity)',
    )
    .in('status', ['new', 'preparing', 'ready'])
    .order('created_at', { ascending: true });

  const all = orders ?? [];
  const shown = all.filter((o) => o.status === tab);
  const now = currentTime();

  return (
    <>
      <AutoRefresh />
      <h1 className="text-3xl font-extrabold">Orders</h1>
      <p className="mb-4 text-muted">{restaurant?.name}</p>
      <nav aria-label="Order status" className="mb-4 flex gap-2">
        {TABS.map((t) => {
          const count = all.filter((o) => o.status === t.status).length;
          const active = t.id === tab;
          return (
            <Link
              key={t.id}
              href={`${routes.restaurant.orders}?tab=${t.id}`}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'flex h-12 items-center gap-2 rounded-full border px-4 font-semibold',
                active ? 'border-brand bg-brand text-white' : 'border-line',
              )}
            >
              {t.label}
              {count > 0 && <span>{count}</span>}
            </Link>
          );
        })}
      </nav>
      {!shown.length ? (
        <Card tone="fill" className="text-muted">
          {EMPTY[tab]}
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((o) => {
            const qty = o.order_items.reduce((n, i) => n + i.quantity, 0);
            return (
              <li key={o.id}>
                <Card>
                  <div className="flex items-baseline justify-between">
                    <Link
                      href={`${routes.restaurant.orders}/${o.id}`}
                      className="font-bold underline-offset-2 hover:underline"
                    >
                      {orderCode(o.id)}
                    </Link>
                    <span className="text-muted">
                      {o.status === 'preparing'
                        ? `Ready in ${minutesToReady(o.accepted_at, o.prep_minutes, now)} min`
                        : o.status === 'ready'
                          ? 'Waiting for driver'
                          : ageLabel(o.created_at, now)}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold">{o.customer_name ?? 'Customer'}</p>
                  <p className="text-muted">
                    {itemCountLabel(qty)} · {formatRand(o.food_cents)}
                  </p>
                  <ul className="my-3 text-muted">
                    {o.order_items.map((i, idx) => (
                      <li key={idx}>
                        {i.quantity}x {i.name}
                      </li>
                    ))}
                  </ul>
                  {o.status === 'new' && <RespondActions orderId={o.id} />}
                  {o.status === 'preparing' && <ReadyAction orderId={o.id} />}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
