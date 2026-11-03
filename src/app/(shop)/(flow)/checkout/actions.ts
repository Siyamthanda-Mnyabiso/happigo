'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { friendlyError } from '@/lib/driver';
import { readCart } from '@/lib/cart-store';
import { clearCart } from '@/lib/cart-store';
import { getCustomer } from '@/lib/customer';
import { routes } from '@/lib/routes';

export type CheckoutState = { errors?: Partial<Record<'address' | 'payment' | 'form', string>> };

const TIPS = [0, 1000, 2000, 3000];

const schema = z.object({
  address: z.string().trim().min(8, 'Enter your full delivery address').max(300),
  instructions: z.string().trim().max(200).default(''),
  note: z.string().trim().max(200).default(''),
  payment: z.enum(['card', 'cash'], 'Choose how you will pay'),
  tip: z.coerce
    .number()
    .int()
    .refine((n) => TIPS.includes(n)),
});

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: NonNullable<CheckoutState['errors']> = {};
    for (const i of parsed.error.issues) errors[i.path[0] as 'address' | 'payment'] ??= i.message;
    return { errors };
  }
  const cart = await readCart();
  if (!cart.branchId || !cart.lines.length) return { errors: { form: 'Your cart is empty.' } };

  const { supabase, user } = await getCustomer(routes.customer.checkout);
  const { address, instructions, note, payment, tip } = parsed.data;
  const { data: orderId, error } = await supabase.rpc('place_order', {
    p_branch: cart.branchId,
    p_items: cart.lines.map((l) => ({ id: l.id, qty: l.qty })),
    p_address: address,
    p_instructions: instructions,
    p_note: note,
    p_payment: payment,
    p_tip: tip,
  });
  if (error || !orderId)
    return { errors: { form: error ? friendlyError(error) : 'Could not place your order.' } };

  // Remember the address for next time. Not worth failing the order over.
  const { data: known } = await supabase
    .from('customer_addresses')
    .select('id')
    .eq('user_id', user.id)
    .eq('address', address)
    .maybeSingle();
  if (!known)
    await supabase.from('customer_addresses').insert({ user_id: user.id, label: 'Home', address });

  await clearCart();
  redirect(routes.customer.order(orderId));
}
