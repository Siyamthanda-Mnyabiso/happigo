'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { parseRand } from '@/lib/money';
import { getMainBranch } from '@/lib/restaurant';
import { routes } from '@/lib/routes';

export type StoreState = {
  errors?: Partial<Record<'name' | 'address' | 'deliveryFee' | 'form', string>>;
  saved?: boolean;
};

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your restaurant name').max(80),
  cuisine: z.string().trim().max(40).optional(),
  address: z.string().trim().min(5, 'Enter the street address customers collect from'),
  deliveryFee: z.string().transform((v, ctx) => {
    const cents = parseRand(v);
    if (cents === null) {
      ctx.addIssue({ code: 'custom', message: 'Enter a fee like 15 or 0' });
      return z.NEVER;
    }
    return cents;
  }),
  accepting: z
    .string()
    .optional()
    .transform((v) => v === 'on'),
});

export async function saveStore(_prev: StoreState, formData: FormData): Promise<StoreState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: NonNullable<StoreState['errors']> = {};
    for (const i of parsed.error.issues) errors[i.path[0] as keyof typeof errors] ??= i.message;
    return { errors };
  }
  const { name, cuisine, address, deliveryFee, accepting } = parsed.data;
  const { supabase, restaurant, branch } = await getMainBranch();

  const r = await supabase
    .from('restaurants')
    .update({ name, cuisine: cuisine || null, delivery_fee_cents: deliveryFee })
    .eq('id', restaurant.id);
  if (r.error) return { errors: { form: 'Could not save. Try again.' } };

  const b = branch
    ? await supabase
        .from('branches')
        .update({ address, accepting_orders: accepting })
        .eq('id', branch.id)
    : await supabase.from('branches').insert({
        restaurant_id: restaurant.id,
        name: 'Main',
        address,
        accepting_orders: accepting,
      });
  if (b.error) return { errors: { form: 'Could not save. Try again.' } };

  revalidatePath(routes.restaurant.store);
  return { saved: true };
}
