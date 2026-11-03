'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { PhotoInput } from '@/components/photo-input';
import { Field } from '@/components/ui/form';
import { CATEGORY_SUGGESTIONS } from '@/lib/menu';
import type { ItemState } from './actions';

type Values = {
  name: string;
  price: string;
  category: string;
  description: string;
  available: boolean;
  popular: boolean;
  imageUrl: string | null;
};

export function ItemForm({
  action,
  values,
  submitLabel,
}: {
  action: (prev: ItemState, formData: FormData) => Promise<ItemState>;
  values: Values;
  submitLabel: string;
}) {
  const [state, run, pending] = useActionState<ItemState, FormData>(action, {});
  const e = state.errors ?? {};
  return (
    <form action={run} noValidate>
      <PhotoInput name="photo" label="Photo" currentUrl={values.imageUrl} error={e.photo} />
      <Field label="Item name" name="name" defaultValue={values.name} error={e.name} />
      <Field
        label="Price in rand"
        name="price"
        inputMode="decimal"
        defaultValue={values.price}
        error={e.price}
      />
      <Field
        label="Category"
        name="category"
        list="categories"
        defaultValue={values.category}
        error={e.category}
      />
      <datalist id="categories">
        {CATEGORY_SUGGESTIONS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <div className="mb-5">
        <label htmlFor="f-description" className="mb-2 block text-base font-semibold">
          Description
        </label>
        <textarea
          id="f-description"
          name="description"
          rows={3}
          defaultValue={values.description}
          className="w-full rounded-2xl bg-card p-4 text-base focus-visible:outline-2 focus-visible:outline-brand"
        />
      </div>
      <label className="mb-3 flex items-center justify-between rounded-[22px] bg-card p-5">
        <span>
          <span className="block font-bold">Available now</span>
          <span className="block text-muted">Customers can order this item</span>
        </span>
        <input
          type="checkbox"
          name="available"
          defaultChecked={values.available}
          className="size-7 accent-brand"
        />
      </label>
      <label className="mb-6 flex items-center justify-between rounded-[22px] bg-card p-5">
        <span>
          <span className="block font-bold">Mark as popular</span>
          <span className="block text-muted">Shown first on your menu</span>
        </span>
        <input
          type="checkbox"
          name="popular"
          defaultChecked={values.popular}
          className="size-7 accent-brand"
        />
      </label>
      {e.form && (
        <p role="alert" className="mb-3 text-base text-danger">
          {e.form}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving' : submitLabel}
      </Button>
    </form>
  );
}
