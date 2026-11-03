import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AutoRefresh } from '@/components/auto-refresh';
import { LinkButton } from '@/components/ui/button';
import { Card } from '@/components/ui/layout';
import { mapsLink, payOf, stageFor } from '@/lib/delivery';
import { getDriver } from '@/lib/driver';
import { formatRand } from '@/lib/money';
import { currentTime } from '@/lib/now';
import { minutesToReady, orderCode } from '@/lib/orders';
import { routes } from '@/lib/routes';
import { confirmDelivered, confirmPickup } from '../../../actions';
import { DeliveryAction } from './delivery-action';

export default async function DeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getDriver();
  const { data: o } = await supabase
    .from('orders')
    .select(
      `id, status, customer_name, delivery_address, delivery_instructions, note, payment_method,
       driver_pay_cents, tip_cents, prep_minutes, accepted_at,
       branches(name, address, restaurants(name)),
       order_items(id, name, options, quantity)`,
    )
    .eq('id', id)
    .maybeSingle();
  if (!o) notFound();

  const stage = stageFor(o.status);
  const restaurant = o.branches?.restaurants?.name ?? 'Restaurant';
  const pickupAddress = o.branches?.address ?? null;
  const pickupMaps = mapsLink(pickupAddress);
  const dropMaps = mapsLink(o.delivery_address);
  const earn = (
    <p className="text-muted">
      You will earn <span className="font-bold text-ink">{formatRand(payOf(o))}</span>
      {o.tip_cents > 0 && ` (includes ${formatRand(o.tip_cents)} tip)`}
    </p>
  );

  return (
    <>
      <AutoRefresh seconds={10} />

      {stage === 'to-restaurant' && (
        <>
          <h1 className="mb-1 text-3xl font-extrabold">Head to the restaurant</h1>
          <p className="mb-6 text-muted">
            Ready in {minutesToReady(o.accepted_at, o.prep_minutes, currentTime())} min
          </p>
          <Card tone="fill" className="mb-4">
            <p className="text-muted">Pick up from</p>
            <p className="text-xl font-bold">{restaurant}</p>
            <p className="text-muted">{pickupAddress}</p>
            <p className="mt-2 text-muted">
              Order {orderCode(o.id)} · {o.order_items.reduce((n, i) => n + i.quantity, 0)} items
            </p>
          </Card>
          {earn}
          <p className="mt-4 text-muted">
            This page updates when the restaurant marks the order ready.
          </p>
          {pickupMaps && (
            <div className="mt-6">
              <LinkButton href={pickupMaps} target="_blank" rel="noopener noreferrer">
                Open directions
              </LinkButton>
            </div>
          )}
        </>
      )}

      {stage === 'pickup' && (
        <>
          <h1 className="mb-4 text-3xl font-extrabold">Pick up order</h1>
          <Card tone="fill" className="mb-4 text-center">
            <p className="text-muted">Order code</p>
            <p className="text-4xl font-extrabold tracking-wider">{orderCode(o.id)}</p>
            <p className="text-muted">Show this code to the restaurant</p>
          </Card>
          <h2 className="mb-2 text-lg font-bold">Check the order</h2>
          <ul className="mb-4 space-y-1">
            {o.order_items.map((i) => (
              <li key={i.id}>
                {i.quantity}x {i.name}
                {i.options && <span className="text-muted"> · {i.options}</span>}
              </li>
            ))}
          </ul>
          {o.note && (
            <Card className="mb-4 rounded-2xl py-3">
              <p className="text-muted">Customer note</p>
              <p className="font-semibold">{o.note}</p>
            </Card>
          )}
          <div className="mb-6">{earn}</div>
          <DeliveryAction
            orderId={o.id}
            action={confirmPickup}
            label="Confirm pickup"
            pendingLabel="Confirming"
          />
        </>
      )}

      {stage === 'to-customer' && (
        <>
          <h1 className="mb-4 text-3xl font-extrabold">Deliver to customer</h1>
          <Card tone="fill" className="mb-4">
            <p className="text-xl font-bold">{o.customer_name ?? 'Customer'}</p>
            <p className="text-muted">{o.delivery_address}</p>
            <p className="mt-2 font-semibold">
              {o.payment_method === 'cash' ? 'Collect cash on delivery' : 'Paid by card'}
            </p>
            {o.delivery_instructions && <p className="font-semibold">{o.delivery_instructions}</p>}
          </Card>
          <div className="mb-6">{earn}</div>
          {dropMaps && (
            <div className="mb-3">
              <LinkButton
                href={dropMaps}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
              >
                Open directions
              </LinkButton>
            </div>
          )}
          <DeliveryAction
            orderId={o.id}
            action={confirmDelivered}
            label="Delivered"
            pendingLabel="Confirming"
          />
        </>
      )}

      {stage === 'done' && (
        <>
          <h1 className="mb-1 text-3xl font-extrabold">Delivery complete</h1>
          <Card tone="dark" className="my-6">
            <p className="text-on-dark">You earned</p>
            <p className="text-4xl font-extrabold">{formatRand(payOf(o))}</p>
            {o.tip_cents > 0 && (
              <p className="text-on-dark">Includes {formatRand(o.tip_cents)} tip</p>
            )}
          </Card>
          <LinkButton href={routes.driver.home}>Find next order</LinkButton>
        </>
      )}

      {stage === 'closed' && (
        <>
          <h1 className="mb-2 text-2xl font-extrabold">This delivery was cancelled</h1>
          <Link href={routes.driver.home} className="font-semibold text-brand">
            Back to home
          </Link>
        </>
      )}
    </>
  );
}
