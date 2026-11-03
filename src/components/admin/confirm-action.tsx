'use client';

import { clsx } from 'clsx';
import { useActionState, useState } from 'react';

export type ActionState = { error?: string };

/**
 * A button that asks once before doing something that affects other people.
 * Pass `confirm` for risky actions; leave it out for undoing one (reinstating).
 */
export function ConfirmAction({
  action,
  label,
  confirm,
  confirmLabel,
  danger,
}: {
  action: () => Promise<ActionState>;
  label: string;
  confirm?: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async () => action(),
    {},
  );
  const [asking, setAsking] = useState(false);
  const base =
    'inline-flex h-12 items-center justify-center rounded-xl px-6 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60';
  const tone = danger
    ? 'bg-danger text-white hover:opacity-90'
    : 'bg-ink text-white hover:bg-ink-soft';

  return (
    <div>
      {asking && confirm ? (
        <div role="alert" className="rounded-xl border border-line bg-card p-4">
          <p className="mb-4 font-semibold">{confirm}</p>
          <form action={formAction} className="flex flex-wrap gap-3">
            <button type="submit" disabled={pending} className={clsx(base, tone)}>
              {pending ? 'Working' : (confirmLabel ?? label)}
            </button>
            <button
              type="button"
              onClick={() => setAsking(false)}
              className={clsx(base, 'border border-line bg-white text-ink hover:bg-card')}
            >
              Keep as it is
            </button>
          </form>
        </div>
      ) : (
        <form action={confirm ? undefined : formAction}>
          <button
            type={confirm ? 'button' : 'submit'}
            onClick={confirm ? () => setAsking(true) : undefined}
            disabled={pending}
            className={clsx(base, tone)}
          >
            {pending ? 'Working' : label}
          </button>
        </form>
      )}
      {state.error && (
        <p role="alert" className="mt-3 text-danger">
          {state.error}
        </p>
      )}
    </div>
  );
}
