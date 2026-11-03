import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CaretLeftIcon, ClockIcon } from '@phosphor-icons/react/dist/ssr';
import { Card } from '@/components/ui/layout';
import { formatRand } from '@/lib/money';
import { orderCode } from '@/lib/orders';
import { calcOrderTotals } from '@/lib/pricing';
import { getPartner } from '@/lib/restaurant';
import { routes } from '@/lib/routes';
import { AutoRefresh } from '../auto-refresh';
import { Countdown } from '../countdown';
import { ReadyAction, RespondActions } from '../order-actions';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getPartner();
  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, status, food_cents, delivery_fee_cents, customer_name, delivery_address, note, respond_by, order_items(id, name, options, quantity, unit_price_cents)',
    )
    .eq('id', id)
    .maybeSingle();
  if (!order) notFound();
  const totals = calcOrderTotals({ food: order.food_cents, deliveryFee: order.delivery_fee_cents });

  return (
    <>
      <AutoRefresh />
      <header className="mb-4 flex items-center gap-3">
        <Link
          href={routes.restaurant.orders}
          aria-label="Back to orders"
          className="flex size-11 items-center justify-center rounded-full border border-line"
        >
          <CaretLeftIcon weight="bold" className="size-5" aria-hidden />
        </Link>
        <h1 className="text-lg font-bold">Order {orderCode(order.id)}</h1>
      </header>

      {order.status === 'new' && (
        <Card tone="fill" className="mb-3 flex items-center justify-between rounded-[18px] py-4">
          <span className="flex items-center gap-3">
            <ClockIcon weight="bold" className="size-6" aria-hidden /> Respond within
          </span>
          <Countdown deadline={order.respond_by} />
        </Card>
      )}

      <Card tone="fill" className="mb-6">
        <p className="font-bold">{order.customer_name ?? 'Customer'}</p>
        <p className="text-muted">{order.delivery_address}</p>
      </Card>

      <h2 className="mb-3 text-lg font-bold">Items</h2>
      <ul className="mb-4 flex flex-col gap-4">
        {order.order_items.map((i) => (
          <li key={i.id} className="flex gap-3">
            <span className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-card font-bold">
              {i.quantity}x
            </span>
            <span className="flex-1">
              <span className="block font-semibold">{i.name}</span>
              {i.options && <span className="block text-muted">{i.options}</span>}
            </span>
            <span className="font-semibold">{formatRand(i.unit_price_cents * i.quantity)}</span>
          </li>
        ))}
      </ul>

      {order.note && (
        <Card className="mb-4 rounded-2xl py-3 font-medium">
          <span className="sr-only">Customer note: </span>
          {order.note}
        </Card>
      )}

      <dl className="mb-6 divide-y divide-line border-y border-line">
        <div className="flex justify-between py-3 text-muted">
          <dt>Subtotal</dt>
          <dd className="font-semibold text-ink">{formatRand(totals.food)}</dd>
        </div>
        <div className="flex justify-between py-3 text-muted">
          <dt>HappiGo commission</dt>
          <dd className="font-semibold text-ink">{formatRand(totals.commission)}</dd>
        </div>
        <div className="flex items-baseline justify-between py-3">
          <dt className="text-lg font-bold">Paid to your account</dt>
          <dd className="text-xl font-extrabold text-brand">
            {formatRand(totals.restaurantPayout)}
          </dd>
        </div>
      </dl>

      {order.status === 'new' && <RespondActions orderId={order.id} choosePrep />}
      {order.status === 'preparing' && <ReadyAction orderId={order.id} />}
      {order.status === 'ready' && (
        <p className="text-muted">Ready. Waiting for the driver to collect it.</p>
      )}
    </>
  );
}
