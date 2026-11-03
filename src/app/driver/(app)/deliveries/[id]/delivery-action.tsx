'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import type { DriverActionState } from '../../../actions';

const idle: DriverActionState = {};

/** One big button that runs a server action for an order and shows its error, if any. */
export function DeliveryAction({
  orderId,
  action,
  label,
  pendingLabel,
}: {
  orderId: string;
  action: (prev: DriverActionState, formData: FormData) => Promise<DriverActionState>;
  label: string;
  pendingLabel: string;
}) {
  const [state, run, pending] = useActionState(action, idle);
  return (
    <form action={run}>
      <input type="hidden" name="orderId" value={orderId} />
      <Button type="submit" disabled={pending}>
        {pending ? pendingLabel : label}
      </Button>
      {state.error && (
        <p role="alert" className="mt-2 text-base text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
