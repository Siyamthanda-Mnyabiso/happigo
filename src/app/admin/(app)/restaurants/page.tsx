import Link from 'next/link';
import { Chip } from '@/components/admin/chip';
import { ConfirmAction } from '@/components/admin/confirm-action';
import { DetailRow, Drawer } from '@/components/admin/drawer';
import { PageHead } from '@/components/admin/page-head';
import { SearchBox } from '@/components/admin/search';
import { cell, cellRight, DataTable } from '@/components/admin/table';
import { Tabs } from '@/components/admin/tabs';
import { getAdmin } from '@/lib/admin';
import { dateLabel, pick, PLAN_LABEL, RESTAURANT_STATUS } from '@/lib/admin-format';
import { formatRand } from '@/lib/money';
import { routes } from '@/lib/routes';
import { setRestaurantSuspended } from '../actions';

export const metadata = { title: 'Restaurants | HappiGo admin' };
export const dynamic = 'force-dynamic';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'setup', label: 'Setting up' },
  { id: 'suspended', label: 'Suspended' },
] as const;

type Detail = {
  id: string;
  name: string;
  cuisine: string | null;
  owner_name: string | null;
  owner_email: string | null;
  address: string | null;
  accepting_orders: boolean;
  plan: string | null;
  bank: string | null;
  delivery_fee_cents: number;
  suspended: boolean;
  orders_this_month: number;
  food_this_month_cents: number;
};

export default async function RestaurantsPage({
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

  const { data } = await supabase.rpc('admin_restaurants');
  const rows = (data ?? []).filter((r) => {
    const okTab =
      tab === 'all' ||
      (tab === 'live' && r.status === 'live') ||
      (tab === 'suspended' && r.status === 'suspended') ||
      (tab === 'setup' && (r.status === 'no_bank' || r.status === 'no_plan'));
    return okTab && (!q || r.name.toLowerCase().includes(q.toLowerCase()));
  });

  const detail = sp.view
    ? ((await supabase.rpc('admin_restaurant', { rid: sp.view })).data as Detail | null)
    : null;
  const qs = (extra: Record<string, string>) =>
    `${routes.admin.restaurants}?${new URLSearchParams({ ...(tab !== 'all' ? { tab } : {}), ...(q ? { q } : {}), ...extra })}`;

  return (
    <>
      <PageHead title="Restaurants" note="Everyone who sells on HappiGo" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <SearchBox label="Search restaurants" q={q} hidden={tab !== 'all' ? { tab } : {}} />
      </div>
      <div className="mb-6">
        <Tabs
          tabs={TABS}
          current={tab}
          href={(id) => `${routes.admin.restaurants}${id === 'all' ? '' : `?tab=${id}`}`}
        />
      </div>
      <DataTable
        caption="Restaurants"
        heads={[
          { label: 'Restaurant' },
          { label: 'Plan' },
          { label: 'Status' },
          { label: 'Orders this month', right: true },
          { label: 'Joined' },
          { label: 'Details' },
        ]}
        isEmpty={rows.length === 0}
        empty="No restaurants match"
      >
        {rows.map((r) => {
          const s = RESTAURANT_STATUS[r.status];
          return (
            <tr key={r.id}>
              <td className={cell}>
                <p className="font-semibold">{r.name}</p>
                <p className="text-muted">{r.cuisine ?? 'No cuisine set'}</p>
              </td>
              <td className={cell}>{r.plan ? (PLAN_LABEL[r.plan] ?? r.plan) : 'None'}</td>
              <td className={cell}>
                <Chip tone={s.tone}>{s.label}</Chip>
              </td>
              <td className={cellRight}>{r.orders_this_month}</td>
              <td className={cell}>{dateLabel(r.joined)}</td>
              <td className={cell}>
                <Link
                  href={qs({ view: r.id })}
                  aria-label={`View ${r.name}`}
                  className="font-semibold text-brand"
                >
                  View
                </Link>
              </td>
            </tr>
          );
        })}
      </DataTable>

      {detail && (
        <Drawer title={detail.name} closeHref={qs({})} width={520}>
          <dl className="mb-8">
            <DetailRow label="Owner">
              {detail.owner_name ?? 'Not given'}
              {detail.owner_email && (
                <span className="block font-normal text-muted">{detail.owner_email}</span>
              )}
            </DetailRow>
            <DetailRow label="Address">{detail.address ?? 'No branch yet'}</DetailRow>
            <DetailRow label="Plan">
              {detail.plan ? (PLAN_LABEL[detail.plan] ?? detail.plan) : 'None chosen'}
            </DetailRow>
            <DetailRow label="Bank account">{detail.bank ?? 'Not added'}</DetailRow>
            <DetailRow label="Delivery fee">{formatRand(detail.delivery_fee_cents)}</DetailRow>
            <DetailRow label="Accepting orders">{detail.accepting_orders ? 'Yes' : 'No'}</DetailRow>
          </dl>
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-line p-4">
              <p className="text-muted">Orders this month</p>
              <p className="text-2xl font-extrabold">{detail.orders_this_month}</p>
            </div>
            <div className="rounded-xl border border-line p-4">
              <p className="text-muted">Food sales this month</p>
              <p className="text-2xl font-extrabold">{formatRand(detail.food_this_month_cents)}</p>
            </div>
          </div>
          {detail.suspended ? (
            <>
              <p className="mb-4 text-muted">
                This restaurant is suspended. Customers cannot see or order from it.
              </p>
              <ConfirmAction
                action={setRestaurantSuspended.bind(null, detail.id, false)}
                label="Reinstate restaurant"
              />
            </>
          ) : (
            <>
              <p className="mb-4 text-muted">
                Suspending hides the restaurant from customers straight away. Orders already placed
                are not cancelled.
              </p>
              <ConfirmAction
                danger
                action={setRestaurantSuspended.bind(null, detail.id, true)}
                label="Suspend restaurant"
                confirm={`Suspend ${detail.name}? Customers will stop seeing it right away.`}
                confirmLabel="Yes, suspend"
              />
            </>
          )}
        </Drawer>
      )}
    </>
  );
}
