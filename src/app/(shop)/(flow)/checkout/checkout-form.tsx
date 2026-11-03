'use client';

import {
  StorefrontIcon,
  ChatCircleIcon,
  CreditCardIcon,
  MapPinIcon,
  MoneyIcon,
  ScooterIcon,
} from '@phosphor-icons/react';
import { useActionState, useState } from 'react';
import { TIP_OPTIONS_CENTS } from '@/lib/cart';
import { formatRand } from '@/lib/money';
import { placeOrder, type CheckoutState } from './actions';

const inputBase =
  'h-14 w-full rounded-2xl bg-card pl-12 pr-4 text-base placeholder:text-[#a89e97] focus-visible:outline-2 focus-visible:outline-brand';

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex size-6 items-center justify-center rounded-full border-2 ${checked ? 'border-brand' : 'border-line'}`}
    >
      {checked && <span className="size-3 rounded-full bg-brand" />}
    </span>
  );
}

export function CheckoutForm({
  food,
  deliveryFee,
  defaultAddress,
}: {
  food: number;
  deliveryFee: number;
  defaultAddress: string;
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const [tip, setTip] = useState<number>(0);
  const [payment, setPayment] = useState<'card' | 'cash'>('card');
  const e = state.errors ?? {};
  const total = food + deliveryFee + tip;

  return (
    <form action={action} noValidate className="pb-52">
      <h2 className="mb-3 mt-6 text-[17px] font-bold">Delivery address</h2>
      <div className="relative">
        <label htmlFor="address" className="sr-only">
          Delivery address
        </label>
        <MapPinIcon
          weight="bold"
          className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-brand"
          aria-hidden
        />
        <input
          id="address"
          name="address"
          autoComplete="street-address"
          defaultValue={defaultAddress}
          placeholder="Street, suburb, city"
          aria-invalid={!!e.address}
          aria-describedby={e.address ? 'address-err' : undefined}
          className={`${inputBase} border-[1.5px] border-line bg-white`}
        />
      </div>
      {e.address && (
        <p id="address-err" className="mt-1 text-base text-danger">
          {e.address}
        </p>
      )}

      <h2 className="mb-3 mt-6 text-[17px] font-bold">Delivery time</h2>
      <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-brand bg-peach p-4">
        <ScooterIcon weight="bold" className="size-6 text-brand" aria-hidden />
        <div>
          <p className="font-semibold">ASAP</p>
          <p className="text-muted">As soon as the restaurant has it ready</p>
        </div>
      </div>

      <h2 className="mb-3 mt-6 text-[17px] font-bold">Payment</h2>
      <div className="space-y-3">
        {(
          [
            ['card', 'Card', 'Pay now', CreditCardIcon],
            ['cash', 'Cash on delivery', 'Pay your driver', MoneyIcon],
          ] as const
        ).map(([value, label, detail, Icon]) => (
          <label
            key={value}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${payment === value ? 'border-brand' : 'border-line'}`}
          >
            <input
              type="radio"
              name="payment"
              value={value}
              checked={payment === value}
              onChange={() => setPayment(value)}
              className="sr-only"
            />
            <Icon
              weight="bold"
              className={`size-6 ${payment === value ? 'text-brand' : 'text-muted'}`}
              aria-hidden
            />
            <span className="flex-1">
              <span className="block font-semibold">{label}</span>
              <span className="block text-muted">{detail}</span>
            </span>
            <Radio checked={payment === value} />
          </label>
        ))}
      </div>
      {e.payment && <p className="mt-1 text-base text-danger">{e.payment}</p>}

      <fieldset className="mt-6">
        <legend className="mb-1 text-[17px] font-bold">Tip your driver</legend>
        <p className="mb-3 text-muted">All of it goes to your driver.</p>
        <div className="grid grid-cols-4 gap-2">
          {TIP_OPTIONS_CENTS.map((c) => (
            <label
              key={c}
              className="flex h-12 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-line font-semibold has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand"
            >
              <input
                type="radio"
                name="tip"
                value={c}
                checked={tip === c}
                onChange={() => setTip(c)}
                className="sr-only"
              />
              {c === 0 ? 'None' : formatRand(c)}
            </label>
          ))}
        </div>
      </fieldset>

      <h2 className="mb-3 mt-6 text-[17px] font-bold">Note for rider</h2>
      <div className="relative">
        <label htmlFor="instructions" className="sr-only">
          Note for rider
        </label>
        <ChatCircleIcon
          weight="bold"
          className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          id="instructions"
          name="instructions"
          placeholder="e.g. Gate code 1234"
          className={inputBase}
        />
      </div>
      <h2 className="mb-3 mt-6 text-[17px] font-bold">Note for the restaurant</h2>
      <div className="relative">
        <label htmlFor="note" className="sr-only">
          Note for the restaurant
        </label>
        <StorefrontIcon
          weight="bold"
          className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input id="note" name="note" placeholder="e.g. No onions" className={inputBase} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[430px] border-t border-line bg-white px-6 pb-6 pt-4 shadow-[0_-8px_16px_rgba(26,13,0,0.04)]">
        <dl className="mb-3 space-y-1 text-muted">
          <div className="flex justify-between">
            <dt>Food</dt>
            <dd>{formatRand(food)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery fee</dt>
            <dd>{formatRand(deliveryFee)}</dd>
          </div>
          {tip > 0 && (
            <div className="flex justify-between">
              <dt>Tip</dt>
              <dd>{formatRand(tip)}</dd>
            </div>
          )}
        </dl>
        {e.form && (
          <p role="alert" className="mb-2 text-base text-danger">
            {e.form}
          </p>
        )}
        <div className="flex items-center gap-4">
          <div>
            <p className="text-muted">Total</p>
            <p className="text-2xl font-extrabold leading-none">{formatRand(total)}</p>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="h-14 flex-1 rounded-full bg-brand text-base font-semibold text-white shadow-[0_8px_8px_rgba(247,59,3,0.35)] hover:bg-brand-hover disabled:opacity-60"
          >
            {pending ? 'Placing order' : 'Place order'}
          </button>
        </div>
      </div>
    </form>
  );
}
