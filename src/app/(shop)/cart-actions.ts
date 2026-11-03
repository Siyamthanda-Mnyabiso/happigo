'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { addToCart, EMPTY_CART, setQty } from '@/lib/cart';
import { readCart, writeCart } from '@/lib/cart-store';

const id = z.guid();

export async function addItem(formData: FormData) {
  const branch = id.safeParse(formData.get('branchId'));
  const item = id.safeParse(formData.get('itemId'));
  const qty = z.coerce
    .number()
    .int()
    .min(1)
    .max(20)
    .catch(1)
    .parse(formData.get('qty') ?? 1);
  if (!branch.success || !item.success) return;
  let cart = await readCart();
  for (let i = 0; i < qty; i++) cart = addToCart(cart, branch.data, item.data);
  await writeCart(cart);
  revalidatePath('/', 'layout');
  // From the item screen, go back to the menu. From the menu's plus button, stay put.
  if (formData.get('back') === 'menu')
    redirect(
      String(formData.get('menuHref')).startsWith('/r/') ? String(formData.get('menuHref')) : '/',
    );
}

export async function changeQty(formData: FormData) {
  const item = id.safeParse(formData.get('itemId'));
  const qty = z.coerce.number().int().safeParse(formData.get('qty'));
  if (!item.success || !qty.success) return;
  await writeCart(setQty(await readCart(), item.data, qty.data));
  revalidatePath('/', 'layout');
}

export async function emptyCart() {
  await writeCart(EMPTY_CART);
  revalidatePath('/', 'layout');
}
