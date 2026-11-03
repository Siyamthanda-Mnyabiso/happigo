import { ArrowLeftIcon, CheckCircleIcon, CircleIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { AutoRefresh } from '@/components/auto-refresh';
import { Card } from '@/components/ui/layout';
import { STATUS_COPY, STEPS, isActive } from '@/lib/customer-status';
import { getCustomer } from '@/lib/customer';
import { formatRand } from '@/lib/money';
import { orderCode } from '@/lib/orders';
import { routes } from '@/lib/routes';
import { Totals } from '../../totals';

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
  const failed = copy.step < 0;

  return (
    <>
      {isActive(order.status) && <AutoRefresh seconds={10} />}
      <Link
        href={routes.customer.orders}
        className="mb-4 inline-flex items-center gap-2 font-semibold text-muted"
      >
        <ArrowLeftIcon weight="bold" className="size-5" aria-hidden /> Your orders
      </Link>
      <p className="text-muted">
        {order.branches?.restaurants?.name ?? 'Restaurant'} · {orderCode(order.id)}
      </p>
      <h1 className="text-3xl font-extrabold" aria-live="polite">
        {copy.title}
      </h1>
      <p className="mb-6 text-muted">{copy.detail}</p>

      {!failed && (
        <ol className="mb-6 space-y-3" aria-label="Order progress">
          {STEPS.map((label, i) => {
            const done = i <= copy.step;
            return (
              <li
                key={label}
                className="flex items-center gap-3"
                aria-current={i === copy.step ? 'step' : undefined}
              >
                {done ? (
                  <CheckCircleIcon weight="fill" className="size-6 text-brand" aria-hidden />
                ) : (
                  <CircleIcon className="size-6 text-line" aria-hidden />
                )}
                <span className={done ? 'font-semibold' : 'text-muted'}>{label}</span>
              </li>
            );
          })}
        </ol>
      )}

      {driver && (
        <Card tone="fill" className="mb-6">
          <p className="font-bold">{driver.driver_first_name} is your driver</p>
          <p className="text-muted">
            {driver.vehicle_model} · {driver.vehicle_plate}
          </p>
        </Card>
      )}

      <Card className="mb-6">
        <h2 className="mb-3 font-bold">Your order</h2>
        <ul className="mb-4 space-y-1">
          {items?.map((i) => (
            <li key={i.id} className="flex justify-between">
              <span>
                {i.quantity} × {i.name}
              </span>
              <span>{formatRand(i.quantity * i.unit_price_cents)}</span>
            </li>
          ))}
        </ul>
        <Totals
          food={order.food_cents}
          deliveryFee={order.delivery_fee_cents}
          tip={order.tip_cents}
        />
        <p className="mt-3 text-muted">
          {order.payment_method === 'cash'
            ? 'Pay cash to your driver.'
            : order.payment_status === 'paid'
              ? 'Paid by card.'
              : 'Card payment pending.'}
        </p>
      </Card>
      <p className="text-muted">Delivering to {order.delivery_address}</p>
    </>
  );
}
