import { z } from 'zod';
import { parseRand } from './money';

export const CATEGORY_SUGGESTIONS = ['Popular', 'Burgers', 'Sides', 'Drinks', 'Desserts', 'Mains'];

export const menuItemSchema = z.object({
  name: z.string().trim().min(2, 'Enter the item name').max(80),
  price: z.string().transform((v, ctx) => {
    const cents = parseRand(v);
    if (cents === null || cents === 0) {
      ctx.addIssue({ code: 'custom', message: 'Enter a price like 65 or 65.50' });
      return z.NEVER;
    }
    return cents;
  }),
  category: z.string().trim().min(1, 'Choose or type a category').max(40),
  description: z.string().trim().max(300).optional(),
  // Checkboxes only appear in form data when ticked.
  available: z
    .string()
    .optional()
    .transform((v) => v === 'on'),
  popular: z
    .string()
    .optional()
    .transform((v) => v === 'on'),
});

export type MenuItemRow = {
  id: string;
  name: string;
  price_cents: number;
  category: string;
  available: boolean;
  description: string | null;
  popular: boolean;
};

/** Groups items by category, keeping the order categories first appear in. Popular items go first. */
export function groupByCategory<T extends { category: string; popular: boolean }>(items: T[]) {
  const popular = items.filter((i) => i.popular);
  const groups = new Map<string, T[]>();
  if (popular.length) groups.set('Popular', popular);
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }
  return [...groups].map(([category, list]) => ({ category, items: list }));
}
