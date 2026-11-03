'use client';

import { MinusIcon, PlusIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { formatRand } from '@/lib/money';
import { addItem } from '@/app/(shop)/cart-actions';

/** Quantity stepper and the "Add to cart" button from the item screen. */
export function QtyAdd({
  branchId,
  itemId,
  menuHref,
  priceCents,
  disabled,
}: {
  branchId: string;
  itemId: string;
  menuHref: string;
  priceCents: number;
  disabled: boolean;
}) {
  const [qty, setQty] = useState(1);
  const step =
    'flex size-10 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-brand';
  return (
    <form
      action={addItem}
      className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-[430px] items-center gap-3 border-t border-line bg-white px-6 pb-6 pt-4"
    >
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="qty" value={qty} />
      <input type="hidden" name="back" value="menu" />
      <input type="hidden" name="menuHref" value={menuHref} />
      <div className="flex h-14 items-center rounded-full bg-card px-2">
        <button
          type="button"
          aria-label="One less"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className={step}
        >
          <MinusIcon weight="bold" className="size-5" />
        </button>
        <span className="w-8 text-center text-lg font-bold" aria-live="polite">
          {qty}
        </span>
        <button
          type="button"
          aria-label="One more"
          onClick={() => setQty((q) => Math.min(20, q + 1))}
          className={step}
        >
          <PlusIcon weight="bold" className="size-5" />
        </button>
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="h-14 flex-1 rounded-full bg-brand text-base font-semibold text-white shadow-[0_8px_8px_rgba(247,59,3,0.35)] hover:bg-brand-hover disabled:opacity-60"
      >
        {disabled ? 'Not taking orders' : `Add to cart · ${formatRand(priceCents * qty)}`}
      </button>
    </form>
  );
}
