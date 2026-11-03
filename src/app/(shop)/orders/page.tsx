import Link from 'next/link';
import { Card } from '@/components/ui/layout';
import { AutoRefresh } from '@/components/auto-refresh';
import { STATUS_COPY, isActive } from '@/lib/customer-status';
import { getCustomer } from '@/lib/customer';
import { formatRand } from '@/lib/money';
import { orderCode } from '@/lib/orders';
import { routes } from '@/lib/routes';

export default async function OrdersPage() {
  const { supabase } = await getCustomer(routes.customer.orders);
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_cents, tip_cents, created_at, branches(restaurants(name))')
    .order('created_at', { ascending: false })
    .limit(50);
  const active = (orders ?? []).filter((o) => isActive(o.status));
  const past = (orders ?? []).filter((o) => !isActive(o.status));

  const list = (rows: typeof active) => (
    <ul className="space-y-3">
      {rows.map((o) => (
        <li key={o.id}>
          <Link
            href={routes.customer.order(o.id)}
            className="block rounded-[22px] border border-line p-4 focus-visible:outline-2 focus-visible:outline-brand"
          >
            <p className="font-bold">{o.branches?.restaurants?.name ?? 'Restaurant'}</p>
            <p className="text-muted">
              {orderCode(o.id)} · {formatRand((o.total_cents ?? 0) + o.tip_cents)}
            </p>
            <p className="mt-1 font-semibold text-brand">{STATUS_COPY[o.status].title}</p>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {active.length > 0 && <AutoRefresh seconds={15} />}
      <h1 className="mb-5 text-3xl font-extrabold">Your orders</h1>
      {!orders?.length && (
        <Card tone="fill">
          <p className="font-bold">No orders yet</p>
          <p className="text-muted">Your orders will show up here.</p>
        </Card>
      )}
      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">In progress</h2>
          {list(active)}
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Past orders</h2>
          {list(past)}
        </section>
      )}
    </>
  );
}
