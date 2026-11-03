'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/form';
import { formatRand } from '@/lib/money';
import { TIP_OPTIONS_CENTS } from '@/lib/cart';
import { Totals } from '../totals';
import { placeOrder, type CheckoutState } from './actions';

function Choice({
  name,
  value,
  label,
  checked,
  onChange,
  detail,
}: {
  name: string;
  value: string;
  label: string;
  detail?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line p-4 has-[:checked]:border-brand has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="size-5 accent-brand"
      />
      <span>
        <span className="block font-semibold">{label}</span>
        {detail && <span className="block text-muted">{detail}</span>}
      </span>
    </label>
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
  return (
    <form action={action} noValidate>
      <Field
        label="Delivery address"
        name="address"
        autoComplete="street-address"
        placeholder="Street, suburb, city"
        defaultValue={defaultAddress}
        error={e.address}
      />
      <Field
        label="Delivery instructions (optional)"
        name="instructions"
        placeholder="Gate code, floor, landmark"
      />
      <Field
        label="Note for the restaurant (optional)"
        name="note"
        placeholder="Allergies, no onions"
      />

      <fieldset className="mb-5">
        <legend className="mb-2 text-base font-semibold">Tip for your driver</legend>
        <p className="mb-2 text-muted">100% goes to your driver.</p>
        <div className="grid grid-cols-4 gap-2">
          {TIP_OPTIONS_CENTS.map((c) => (
            <label
              key={c}
              className="flex h-12 cursor-pointer items-center justify-center rounded-full border border-line font-semibold has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand"
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

      <fieldset className="mb-6">
        <legend className="mb-2 text-base font-semibold">Payment</legend>
        <div className="space-y-2">
          <Choice
            name="payment"
            value="card"
            label="Card"
            detail="Pay now"
            checked={payment === 'card'}
            onChange={() => setPayment('card')}
          />
          <Choice
            name="payment"
            value="cash"
            label="Cash on delivery"
            detail="Pay your driver"
            checked={payment === 'cash'}
            onChange={() => setPayment('cash')}
          />
        </div>
        {e.payment && <p className="mt-1 text-base text-danger">{e.payment}</p>}
      </fieldset>

      <div className="mb-6 rounded-[22px] bg-card p-5">
        <Totals food={food} deliveryFee={deliveryFee} tip={tip} />
      </div>
      {e.form && (
        <p role="alert" className="mb-4 text-base text-danger">
          {e.form}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Placing order' : `Place order · ${formatRand(food + deliveryFee + tip)}`}
      </Button>
    </form>
  );
}
