'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addToCart, EMPTY_CART, setQty } from '@/lib/cart';
import { readCart, writeCart } from '@/lib/cart-store';

const id = z.guid();

export async function addItem(formData: FormData) {
  const branch = id.safeParse(formData.get('branchId'));
  const item = id.safeParse(formData.get('itemId'));
  if (!branch.success || !item.success) return;
  await writeCart(addToCart(await readCart(), branch.data, item.data));
  revalidatePath('/', 'layout');
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
