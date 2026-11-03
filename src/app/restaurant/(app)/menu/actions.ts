'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { menuItemSchema } from '@/lib/menu';
import { hasPhoto } from '@/lib/photos';
import { getMainBranch } from '@/lib/restaurant';
import { routes } from '@/lib/routes';
import { uploadPhoto } from '@/lib/upload-photo';

export type ItemState = {
  errors?: Partial<Record<'name' | 'price' | 'category' | 'photo' | 'form', string>>;
};

function parse(formData: FormData) {
  const parsed = menuItemSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) return { data: parsed.data };
  const errors: NonNullable<ItemState['errors']> = {};
  for (const i of parsed.error.issues) errors[i.path[0] as keyof typeof errors] ??= i.message;
  return { errors };
}

/** The new photo's address, nothing if none was chosen, or an error to show. */
async function photoFrom(
  formData: FormData,
  supabase: Parameters<typeof uploadPhoto>[0],
  restaurantId: string,
): Promise<{ url?: string } | { error: string }> {
  const photo = formData.get('photo');
  if (!hasPhoto(photo)) return {};
  return uploadPhoto(supabase, restaurantId, photo);
}

export async function createItem(_prev: ItemState, formData: FormData): Promise<ItemState> {
  const { data, errors } = parse(formData);
  if (!data) return { errors };
  const { supabase, restaurant, branch } = await getMainBranch();
  if (!branch) redirect(routes.restaurant.store);
  const photo = await photoFrom(formData, supabase, restaurant.id);
  if ('error' in photo) return { errors: { photo: photo.error } };
  const { error } = await supabase.from('menu_items').insert({
    branch_id: branch.id,
    name: data.name,
    price_cents: data.price,
    category: data.category,
    description: data.description || null,
    available: data.available,
    popular: data.popular,
    image_url: photo.url ?? null,
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
  const { supabase, restaurant } = await getMainBranch();
  const photo = await photoFrom(formData, supabase, restaurant.id);
  if ('error' in photo) return { errors: { photo: photo.error } };
  const { data: rows, error } = await supabase
    .from('menu_items')
    .update({
      name: data.name,
      price_cents: data.price,
      category: data.category,
      description: data.description || null,
      available: data.available,
      popular: data.popular,
      ...(photo.url && { image_url: photo.url }),
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
