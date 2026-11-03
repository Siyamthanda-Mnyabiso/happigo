import Link from 'next/link';
import { Chip } from '@/components/admin/chip';
import { PageHead } from '@/components/admin/page-head';
import { cell, cellRight, DataTable } from '@/components/admin/table';
import { getAdmin } from '@/lib/admin';
import { ORDER_STATUS, whenLabel } from '@/lib/admin-format';
import { formatRand } from '@/lib/money';
import { orderCode } from '@/lib/orders';
import { routes } from '@/lib/routes';

export const metadata = { title: 'Overview | HappiGo admin' };
export const dynamic = 'force-dynamic';

type Overview = {
  orders_today: number;
  food_today_cents: number;
  restaurants_live: number;
  drivers_online: number;
  unanswered_orders: number;
  restaurants_not_live: number;
  ready_without_driver: number;
};

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-6">
      <p className="text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value}</p>
      {note && <p className="mt-1 text-muted">{note}</p>}
    </div>
  );
}

export default async function OverviewPage() {
  const { supabase } = await getAdmin();
  const [{ data: overview }, { data: orders }] = await Promise.all([
    supabase.rpc('admin_overview'),
    supabase.rpc('admin_orders'),
  ]);
  const o = overview as Overview | null;
  const recent = (orders ?? []).slice(0, 6);

  const attention = o
    ? [
        {
          n: o.unanswered_orders,
          text: (n: number) => `${n} ${n === 1 ? 'order' : 'orders'} unanswered for over 5 minutes`,
          href: `${routes.admin.orders}?tab=new`,
        },
        {
          n: o.restaurants_not_live,
          text: (n: number) => `${n} ${n === 1 ? 'restaurant is' : 'restaurants are'} not live yet`,
          href: `${routes.admin.restaurants}?tab=setup`,
        },
        {
          n: o.ready_without_driver,
          text: (n: number) =>
            `${n} ready ${n === 1 ? 'order has' : 'orders have'} no driver after 10 minutes`,
          href: `${routes.admin.orders}?tab=progress`,
        },
      ].filter((a) => a.n > 0)
    : [];

  return (
    <>
      <PageHead title="Overview" note="How HappiGo is doing today" />
      {!o ? (
        <p role="alert" className="text-danger">
          Could not load the numbers. Refresh to try again.
        </p>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Orders today" value={String(o.orders_today)} />
            <Stat
              label="Food sales today"
              value={formatRand(o.food_today_cents)}
              note="No commission taken"
            />
            <Stat label="Restaurants live" value={String(o.restaurants_live)} />
            <Stat label="Drivers online" value={String(o.drivers_online)} />
          </div>
          <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
            <section aria-labelledby="recent">
              <h2 id="recent" className="mb-4 text-lg font-bold">
                Recent orders
              </h2>
              <DataTable
                caption="Recent orders"
                heads={[
                  { label: 'Order' },
                  { label: 'Restaurant' },
                  { label: 'Customer' },
                  { label: 'Total', right: true },
                  { label: 'Status' },
                ]}
                isEmpty={recent.length === 0}
                empty="No orders yet"
              >
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td className={cell}>
                      <Link
                        href={`${routes.admin.orders}?view=${r.id}`}
                        className="font-semibold hover:text-brand"
                      >
                        {orderCode(r.id)}
                      </Link>
                    </td>
                    <td className={cell}>{r.restaurant_name}</td>
                    <td className={cell}>{r.customer_name ?? 'Guest'}</td>
                    <td className={cellRight}>{formatRand(r.total_cents)}</td>
                    <td className={cell}>
                      <Chip tone={ORDER_STATUS[r.status].tone}>{ORDER_STATUS[r.status].label}</Chip>
                    </td>
                  </tr>
                ))}
              </DataTable>
              <p className="mt-3 text-muted">
                Latest at {whenLabel(recent[0]?.created_at ?? null)}
              </p>
            </section>
            <section aria-labelledby="attention">
              <h2 id="attention" className="mb-4 text-lg font-bold">
                Needs attention
              </h2>
              <div className="rounded-xl border border-line bg-white">
                {attention.length === 0 ? (
                  <p className="px-6 py-10 text-center text-muted">Nothing needs attention</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {attention.map((a) => (
                      <li
                        key={a.href}
                        className="flex items-center justify-between gap-4 px-6 py-4"
                      >
                        <span>{a.text(a.n)}</span>
                        <Link href={a.href} className="shrink-0 font-semibold text-brand">
                          Review
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
