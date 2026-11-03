import Link from 'next/link';
import { clsx } from 'clsx';
import { Card } from '@/components/ui/layout';
import { PERIODS, parsePeriod, payOf, periodStart, summarise } from '@/lib/delivery';
import { getDriver } from '@/lib/driver';
import { formatRand } from '@/lib/money';
import { currentTime } from '@/lib/now';
import { routes } from '@/lib/routes';

const fmt = new Intl.DateTimeFormat('en-ZA', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Africa/Johannesburg',
});

export default async function EarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const period = parsePeriod((await searchParams).period);
  const { supabase, user } = await getDriver();
  const { data } = await supabase
    .from('orders')
    .select('id, driver_pay_cents, tip_cents, delivered_at, branches(restaurants(name))')
    .eq('driver_id', user.id)
    .eq('status', 'delivered')
    .gte('delivered_at', periodStart(period, currentTime()).toISOString())
    .order('delivered_at', { ascending: false });
  const rows = data ?? [];
  const { total, tips, trips } = summarise(rows);

  return (
    <>
      <h1 className="mb-4 text-3xl font-extrabold">Earnings</h1>
      <nav aria-label="Period" className="mb-4 flex gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.id}
            href={`${routes.driver.earnings}?period=${p.id}`}
            aria-current={p.id === period ? 'page' : undefined}
            className={clsx(
              'flex h-12 items-center rounded-full border px-4 font-semibold',
              p.id === period ? 'border-brand bg-brand text-white' : 'border-line',
            )}
          >
            {p.label}
          </Link>
        ))}
      </nav>
      <Card tone="dark" className="mb-4">
        <p className="text-on-dark">{PERIODS.find((p) => p.id === period)!.label}</p>
        <p className="text-4xl font-extrabold">{formatRand(total)}</p>
      </Card>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xl font-bold">{trips}</p>
          <p className="text-muted">Trips</p>
        </Card>
        <Card className="p-4">
          <p className="text-xl font-bold">{formatRand(tips)}</p>
          <p className="text-muted">Tips</p>
        </Card>
      </div>
      <h2 className="mb-2 text-lg font-bold">Deliveries</h2>
      {!rows.length ? (
        <p className="text-muted">No deliveries in this period yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="flex justify-between py-3">
              <span>
                <span className="block font-medium">
                  {r.branches?.restaurants?.name ?? 'Delivery'}
                </span>
                <span className="block text-muted">
                  {r.delivered_at ? fmt.format(new Date(r.delivered_at)) : ''}
                </span>
              </span>
              <span className="font-semibold">{formatRand(payOf(r))}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
