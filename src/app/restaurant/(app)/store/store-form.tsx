'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/form';
import { saveStore, type StoreState } from './actions';

type Props = {
  name: string;
  cuisine: string;
  address: string;
  deliveryFee: string;
  accepting: boolean;
};

export function StoreForm(p: Props) {
  const [state, action, pending] = useActionState<StoreState, FormData>(saveStore, {});
  const e = state.errors ?? {};
  return (
    <form action={action} noValidate>
      <Field label="Restaurant name" name="name" defaultValue={p.name} error={e.name} />
      <Field label="Cuisine" name="cuisine" defaultValue={p.cuisine} placeholder="Burgers" />
      <Field
        label="Street address"
        name="address"
        defaultValue={p.address}
        error={e.address}
        autoComplete="off"
      />
      <Field
        label="Delivery fee in rand"
        name="deliveryFee"
        inputMode="decimal"
        defaultValue={p.deliveryFee}
        error={e.deliveryFee}
      />
      <label className="mb-6 flex items-center justify-between rounded-[22px] bg-card p-5">
        <span>
          <span className="block font-bold">Accepting orders</span>
          <span className="block text-muted">Customers can order right now</span>
        </span>
        <input
          type="checkbox"
          name="accepting"
          defaultChecked={p.accepting}
          className="size-7 accent-brand"
        />
      </label>
      {e.form && (
        <p role="alert" className="mb-3 text-base text-danger">
          {e.form}
        </p>
      )}
      {state.saved && (
        <p role="status" className="mb-3 font-semibold">
          Saved
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving' : 'Save'}
      </Button>
    </form>
  );
}
