'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DEFAULT_PREP, PREP_OPTIONS } from '@/lib/orders';
import { routes } from '@/lib/routes';
import { markReady, respondToOrder, type OrderActionState } from './actions';

const idle: OrderActionState = {};

function ErrorText({ error }: { error?: string }) {
  return error ? (
    <p role="alert" className="mt-2 text-base text-danger">
      {error}
    </p>
  ) : null;
}

/** Decline and Accept. `choosePrep` shows the prep time chips (detail screen); otherwise the default is used. */
export function RespondActions({ orderId, choosePrep }: { orderId: string; choosePrep?: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(respondToOrder, idle);
  useEffect(() => {
    if (state.done && choosePrep) router.push(`${routes.restaurant.orders}?tab=preparing`);
  }, [state.done, choosePrep, router]);

  return (
    <form action={action}>
      <input type="hidden" name="orderId" value={orderId} />
      {choosePrep ? (
        <fieldset className="mb-4">
          <legend className="mb-2 text-lg font-bold">Prep time</legend>
          <div className="flex gap-2">
            {PREP_OPTIONS.map((m) => (
              <label key={m} className="cursor-pointer">
                <input
                  type="radio"
                  name="prep"
                  value={m}
                  defaultChecked={m === DEFAULT_PREP}
                  className="peer sr-only"
                />
                <span className="flex h-12 items-center rounded-full border border-line px-4 font-semibold peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-brand">
                  {m} min
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <input type="hidden" name="prep" value={DEFAULT_PREP} />
      )}
      <div className="flex gap-3">
        <Button
          type="submit"
          name="decision"
          value="decline"
          variant="secondary"
          disabled={pending}
          className="w-[112px] shrink-0 px-0"
        >
          Decline
        </Button>
        <Button type="submit" name="decision" value="accept" disabled={pending}>
          Accept order
        </Button>
      </div>
      <ErrorText error={state.error} />
    </form>
  );
}

export function ReadyAction({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(markReady, idle);
  return (
    <form action={action}>
      <input type="hidden" name="orderId" value={orderId} />
      <Button type="submit" disabled={pending}>
        Mark as ready
      </Button>
      <ErrorText error={state.error} />
    </form>
  );
}
