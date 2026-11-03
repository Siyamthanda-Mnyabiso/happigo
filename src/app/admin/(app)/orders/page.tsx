import Link from 'next/link';
import { Chip } from '@/components/admin/chip';
import { ConfirmAction } from '@/components/admin/confirm-action';
import { DetailRow, Drawer } from '@/components/admin/drawer';
import { PageHead } from '@/components/admin/page-head';
import { SearchBox } from '@/components/admin/search';
import { cell, cellRight, DataTable } from '@/components/admin/table';
import { Tabs } from '@/components/admin/tabs';
import { getAdmin } from '@/lib/admin';
import { ORDER_STATUS, pick, whenLabel } from '@/lib/admin-format';
import { formatRand } from '@/lib/money';
import { orderCode } from '@/lib/orders';
import { routes } from '@/lib/routes';
import type { OrderStatus } from '@/lib/supabase/database.types';
import { cancelOrder } from '../actions';

export const metadata = { title: 'Orders | HappiGo admin' };
export const dynamic = 'force-dynamic';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'progress', label: 'In progress' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
] as const;

type Detail = {
  id: string;
  status: OrderStatus;
  created_at: string;
  accepted_at: string | null;
  prep_minutes: number | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  customer_name: string | null;
  customer_email: string | null;
  delivery_address: string | null;
  note: string | null;
  restaurant_name: string;
  restaurant_address: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  food_cents: number;
  delivery_fee_cents: number;
  tip_cents: number;
  paid_cents: number;
  payment_method: string;
  items: { name: string; options: string | null; quantity: number; unit_price_cents: number }[];
};

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-1 font-bold">{title}</h3>
      <div className="text-muted">{children}</div>
    </section>
  );
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const tab = pick(
    sp.tab,
    TABS.map((t) => t.id),
    'all',
  );
  const q = (sp.q ?? '').trim().slice(0, 80);
  const { supabase } = await getAdmin();

  const { data } = await supabase.rpc('admin_orders', { search: q || undefined, filter: tab });
  const rows = data ?? [];
  const detail = sp.view
    ? ((await supabase.rpc('admin_order', { oid: sp.view })).data as Detail | null)
    : null;
  const qs = (extra: Record<string, string>) =>
    `${routes.admin.orders}?${new URLSearchParams({ ...(tab !== 'all' ? { tab } : {}), ...(q ? { q } : {}), ...extra })}`;

  const steps = detail
    ? [
        { label: 'Placed', at: detail.created_at },
        {
          label: detail.prep_minutes
            ? `Accepted, ${detail.prep_minutes} min to prepare`
            : 'Accepted',
          at: detail.accepted_at,
        },
        { label: 'Picked up', at: detail.picked_up_at },
        { label: 'Delivered', at: detail.delivered_at },
      ]
    : [];
  const canCancel = detail && ['new', 'preparing', 'ready'].includes(detail.status);

  return (
    <>
      <PageHead title="Orders" note="Latest 200 orders" />
      <div className="mb-4">
        <SearchBox
          label="Search by order code or customer"
          q={q}
          hidden={tab !== 'all' ? { tab } : {}}
        />
      </div>
      <div className="mb-6">
        <Tabs
          tabs={TABS}
          current={tab}
          href={(id) => `${routes.admin.orders}${id === 'all' ? '' : `?tab=${id}`}`}
        />
      </div>
      <DataTable
        caption="Orders"
        heads={[
          { label: 'Order' },
          { label: 'Restaurant' },
          { label: 'Customer' },
          { label: 'Driver' },
          { label: 'Total', right: true },
          { label: 'Status' },
          { label: 'Placed' },
        ]}
        isEmpty={rows.length === 0}
        empty="No orders match"
      >
        {rows.map((r) => (
          <tr key={r.id}>
            <td className={cell}>
              <Link href={qs({ view: r.id })} className="font-semibold hover:text-brand">
                {orderCode(r.id)}
              </Link>
            </td>
            <td className={cell}>{r.restaurant_name}</td>
            <td className={cell}>{r.customer_name ?? 'Guest'}</td>
            <td className={cell}>{r.driver_name ?? 'Not assigned'}</td>
            <td className={cellRight}>{formatRand(r.total_cents)}</td>
            <td className={cell}>
              <Chip tone={ORDER_STATUS[r.status].tone}>{ORDER_STATUS[r.status].label}</Chip>
            </td>
            <td className={cell}>{whenLabel(r.created_at)}</td>
          </tr>
        ))}
      </DataTable>

      {detail && (
        <Drawer title={`Order ${orderCode(detail.id)}`} closeHref={qs({})} width={560}>
          <p className="mb-6">
            <Chip tone={ORDER_STATUS[detail.status].tone}>{ORDER_STATUS[detail.status].label}</Chip>
          </p>
          <ol className="mb-8 border-l-2 border-line pl-6">
            {steps.map((s) => (
              <li key={s.label} className="relative pb-4 last:pb-0">
                <span
                  className={`absolute -left-[31px] top-2 size-2.5 rounded-full ${s.at ? 'bg-brand' : 'bg-line'}`}
                  aria-hidden
                />
                <span className={s.at ? 'font-semibold' : 'text-muted'}>{s.label}</span>
                <span className="block text-muted">{whenLabel(s.at)}</span>
              </li>
            ))}
          </ol>
          <Block title="Customer">
            <p>{detail.customer_name ?? 'Guest'}</p>
            {detail.customer_email && <p>{detail.customer_email}</p>}
            {detail.delivery_address && <p>{detail.delivery_address}</p>}
            {detail.note && <p>Note: {detail.note}</p>}
          </Block>
          <Block title="Restaurant">
            <p>{detail.restaurant_name}</p>
            {detail.restaurant_address && <p>{detail.restaurant_address}</p>}
          </Block>
          <Block title="Driver">
            {detail.driver_name ? (
              <p>
                {detail.driver_name}
                {detail.driver_phone && `, ${detail.driver_phone}`}
              </p>
            ) : (
              <p>Not assigned yet</p>
            )}
          </Block>
          <section className="mb-6">
            <h3 className="mb-2 font-bold">Items</h3>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {detail.items.map((i, n) => (
                <li key={n} className="flex justify-between gap-4 px-4 py-3">
                  <span>
                    {i.quantity} x {i.name}
                    {i.options && <span className="block text-muted">{i.options}</span>}
                  </span>
                  <span className="font-semibold">
                    {formatRand(i.quantity * i.unit_price_cents)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <dl className="mb-8">
            <DetailRow label="Food">{formatRand(detail.food_cents)}</DetailRow>
            <DetailRow label="Delivery fee">{formatRand(detail.delivery_fee_cents)}</DetailRow>
            <DetailRow label="Tip">{formatRand(detail.tip_cents)}</DetailRow>
            <DetailRow label="HappiGo commission">R0</DetailRow>
            <DetailRow label={`Customer paid (${detail.payment_method})`}>
              {formatRand(detail.paid_cents)}
            </DetailRow>
          </dl>
          {canCancel ? (
            <ConfirmAction
              danger
              action={cancelOrder.bind(null, detail.id)}
              label="Cancel order"
              confirm={`Cancel order ${orderCode(detail.id)}? The restaurant and driver will see it as cancelled.`}
              confirmLabel="Yes, cancel order"
            />
          ) : (
            <p className="text-muted">This order can no longer be cancelled.</p>
          )}
        </Drawer>
      )}
    </>
  );
}
