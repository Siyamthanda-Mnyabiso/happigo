'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { menuItemSchema } from '@/lib/menu';
import { getMainBranch } from '@/lib/restaurant';
import { routes } from '@/lib/routes';

export type ItemState = {
  errors?: Partial<Record<'name' | 'price' | 'category' | 'form', string>>;
};

function parse(formData: FormData) {
  const parsed = menuItemSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) return { data: parsed.data };
  const errors: NonNullable<ItemState['errors']> = {};
  for (const i of parsed.error.issues) errors[i.path[0] as keyof typeof errors] ??= i.message;
  return { errors };
}

export async function createItem(_prev: ItemState, formData: FormData): Promise<ItemState> {
  const { data, errors } = parse(formData);
  if (!data) return { errors };
  const { supabase, branch } = await getMainBranch();
  if (!branch) redirect(routes.restaurant.store);
  const { error } = await supabase.from('menu_items').insert({
    branch_id: branch.id,
    name: data.name,
    price_cents: data.price,
    category: data.category,
    description: data.description || null,
    available: data.available,
    popular: data.popular,
  });
  if (error) return { errors: { form: 'Could not save. Try again.' } };
  revalidatePath(routes.restaurant.menu);
  redirect(routes.restaurant.menu);
}

export async function updateItem(
  id: string,
  _prev: ItemState,
  formData: FormData,
): Promise<ItemState> {
  if (!z.uuid().safeParse(id).success) return { errors: { form: 'Item not found' } };
  const { data, errors } = parse(formData);
  if (!data) return { errors };
  const { supabase } = await getMainBranch();
  const { data: rows, error } = await supabase
    .from('menu_items')
    .update({
      name: data.name,
      price_cents: data.price,
      category: data.category,
      description: data.description || null,
      available: data.available,
      popular: data.popular,
    })
    .eq('id', id)
    .select('id');
  if (error || !rows?.length) return { errors: { form: 'Could not save. Try again.' } };
  revalidatePath(routes.restaurant.menu);
  redirect(routes.restaurant.menu);
}

export async function deleteItem(id: string) {
  if (!z.uuid().safeParse(id).success) redirect(routes.restaurant.menu);
  const { supabase } = await getMainBranch();
  await supabase.from('menu_items').delete().eq('id', id);
  revalidatePath(routes.restaurant.menu);
  redirect(routes.restaurant.menu);
}
