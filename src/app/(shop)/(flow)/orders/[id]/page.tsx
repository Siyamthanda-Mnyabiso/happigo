import { UserIcon } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { AutoRefresh } from '@/components/auto-refresh';
import { BackButton } from '@/components/shop/back-button';
import { getCustomer } from '@/lib/customer';
import { LIT, STATUS_COPY, STEPS, isActive } from '@/lib/customer-status';
import { formatRand } from '@/lib/money';
import { orderCode } from '@/lib/orders';
import { routes } from '@/lib/routes';
import { Totals } from '@/app/(shop)/totals';

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const parsed = z.guid().safeParse((await params).id);
  if (!parsed.success) notFound();
  const { supabase } = await getCustomer(routes.customer.order(parsed.data));

  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, status, food_cents, delivery_fee_cents, tip_cents, payment_method, payment_status, delivery_address, branches(name, restaurants(name))',
    )
    .eq('id', parsed.data)
    .maybeSingle();
  if (!order) notFound(); // someone else's order looks exactly like one that does not exist

  const [{ data: items }, { data: tracking }] = await Promise.all([
    supabase
      .from('order_items')
      .select('id, name, quantity, unit_price_cents')
      .eq('order_id', order.id),
    supabase.rpc('order_tracking', { oid: order.id }),
  ]);
  const driver = tracking?.[0];
  const copy = STATUS_COPY[order.status];
  const lit = LIT[order.status];
  const failed = copy.step < 0;
  const count = items?.reduce((n, i) => n + i.quantity, 0) ?? 0;

  return (
    <div className="pb-10">
      {isActive(order.status) && <AutoRefresh seconds={10} />}
      <header className="relative overflow-hidden rounded-b-[40px] bg-brand px-6 pb-8 pt-12 text-white">
        <span aria-hidden className="absolute -right-16 -top-24 size-60 rounded-full bg-white/10" />
        <div className="relative">
          <BackButton href={routes.customer.orders} label="Your orders" className="text-ink" />
          <Image
            src="/brand/happigo-logo.svg"
            alt="HappiGo"
            width={140}
            height={93}
            className="mx-auto -mt-8 h-auto w-[120px]"
            priority
          />
          <p className="mt-4 text-on-dark">
            {order.branches?.restaurants?.name ?? 'Restaurant'} · {orderCode(order.id)}
          </p>
          <h1 className="text-[30px] font-extrabold leading-tight" aria-live="polite">
            {copy.title}
          </h1>
          <p className="text-white/85">{copy.detail}</p>
        </div>
      </header>

      <div className="px-6">
        {!failed && (
          <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Order progress">
            {STEPS.map((label, i) => (
              <li key={label} aria-current={i === lit - 1 ? 'step' : undefined}>
                <span className={`block h-1.5 rounded-full ${i < lit ? 'bg-brand' : 'bg-line'}`} />
                <span className={`mt-2 block text-sm ${i < lit ? 'font-semibold' : 'text-muted'}`}>
                  {label}
                </span>
              </li>
            ))}
          </ol>
        )}

        {driver && (
          <div className="mt-6 flex items-center gap-4 rounded-3xl bg-card p-4">
            <span className="flex size-14 items-center justify-center rounded-full bg-white text-muted">
              <UserIcon weight="bold" className="size-7" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-bold">{driver.driver_first_name}</p>
              <p className="text-muted">
                {driver.vehicle_model} · {driver.vehicle_plate}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-baseline justify-between">
          <div>
            <p className="text-[17px] font-bold">Order {orderCode(order.id)}</p>
            <p className="text-muted">
              {count} {count === 1 ? 'item' : 'items'} ·{' '}
              {formatRand(order.food_cents + order.delivery_fee_cents + order.tip_cents)}
            </p>
          </div>
        </div>

        <section
          aria-label="Your order"
          className="mt-5 rounded-3xl border-[1.5px] border-line p-5"
        >
          <ul className="mb-4 space-y-2">
            {items?.map((i) => (
              <li key={i.id} className="flex justify-between">
                <span>
                  {i.quantity} × {i.name}
                </span>
                <span className="font-medium">{formatRand(i.quantity * i.unit_price_cents)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-line pt-4">
            <Totals
              food={order.food_cents}
              deliveryFee={order.delivery_fee_cents}
              tip={order.tip_cents}
            />
          </div>
          <p className="mt-4 text-muted">
            {order.payment_method === 'cash'
              ? 'Pay cash to your driver.'
              : order.payment_status === 'paid'
                ? 'Paid by card.'
                : 'Card payment pending.'}
          </p>
        </section>
        <p className="mt-4 text-muted">Delivering to {order.delivery_address}</p>
      </div>
    </div>
  );
}
