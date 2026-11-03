'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/layout';
import { distanceLabel } from '@/lib/delivery';
import { formatRand } from '@/lib/money';
import { itemCountLabel } from '@/lib/orders';
import { acceptDelivery, declineDelivery, type DriverActionState } from '../../actions';

export type Offer = {
  order_id: string;
  restaurant_name: string;
  pickup_address: string | null;
  item_count: number;
  distance_km: number | null;
  driver_pay_cents: number;
  tip_cents: number;
  status: string;
};

const idle: DriverActionState = {};

export function OfferCard({ offer }: { offer: Offer }) {
  const [accept, acceptAction, accepting] = useActionState(acceptDelivery, idle);
  const [decline, declineAction, declining] = useActionState(declineDelivery, idle);
  const busy = accepting || declining;
  const error = accept.error ?? decline.error;
  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-extrabold">{formatRand(offer.driver_pay_cents)}</p>
        <p className="text-muted">{distanceLabel(offer.distance_km)}</p>
      </div>
      {offer.tip_cents > 0 && (
        <p className="text-muted">Includes {formatRand(offer.tip_cents)} tip</p>
      )}
      <p className="mt-3 font-semibold">{offer.restaurant_name}</p>
      <p className="text-muted">
        {offer.pickup_address} · {itemCountLabel(offer.item_count)}
      </p>
      <p className="mt-1 text-muted">
        {offer.status === 'ready' ? 'Ready to collect' : 'Still being prepared'}
      </p>
      <div className="mt-4 flex gap-3">
        <form action={declineAction}>
          <input type="hidden" name="orderId" value={offer.order_id} />
          <Button type="submit" variant="secondary" disabled={busy} className="w-[112px] px-0">
            Decline
          </Button>
        </form>
        <form action={acceptAction} className="flex-1">
          <input type="hidden" name="orderId" value={offer.order_id} />
          <Button type="submit" disabled={busy}>
            Accept
          </Button>
        </form>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-base text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}
