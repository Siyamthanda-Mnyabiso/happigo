'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getPartner } from '@/lib/restaurant';
import { PREP_OPTIONS } from '@/lib/orders';
import { routes } from '@/lib/routes';

export type OrderActionState = { error?: string; done?: boolean };

const base = z.object({ orderId: z.uuid() });
const respond = base.extend({
  decision: z.enum(['accept', 'decline']),
  prep: z.coerce
    .number()
    .pipe(z.literal([...PREP_OPTIONS]))
    .optional(),
});

const GONE = 'This order has already been dealt with. Refresh to see the latest.';

export async function respondToOrder(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const parsed = respond.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Choose a prep time' };
  const { orderId, decision, prep } = parsed.data;
  if (decision === 'accept' && !prep) return { error: 'Choose a prep time' };

  const { supabase } = await getPartner();
  const patch =
    decision === 'accept'
      ? { status: 'preparing' as const, prep_minutes: prep }
      : { status: 'declined' as const };
  // `.eq('status', 'new')` means a double tap or a stale screen can't act twice.
  const { data, error } = await supabase
    .from('orders')
    .update(patch)
    .eq('id', orderId)
    .eq('status', 'new')
    .select('id');
  if (error) return { error: 'Something went wrong. Try again.' };
  if (!data?.length) return { error: GONE };
  revalidatePath(routes.restaurant.orders);
  return { done: true };
}

export async function markReady(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const parsed = base.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: GONE };
  const { supabase } = await getPartner();
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'ready' })
    .eq('id', parsed.data.orderId)
    .eq('status', 'preparing')
    .select('id');
  if (error) return { error: 'Something went wrong. Try again.' };
  if (!data?.length) return { error: GONE };
  revalidatePath(routes.restaurant.orders);
  return { done: true };
}
