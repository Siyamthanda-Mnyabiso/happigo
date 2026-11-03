import { z } from 'zod';

export const MAX_QTY = 20;

export type Cart = { branchId: string | null; lines: { id: string; qty: number }[] };
export const EMPTY_CART: Cart = { branchId: null, lines: [] };

const schema = z.object({
  branchId: z.guid().nullable(),
  lines: z.array(z.object({ id: z.guid(), qty: z.number().int().min(1).max(MAX_QTY) })).max(30),
});

/** The cart lives in a cookie the customer controls, so treat it as untrusted. Anything odd becomes an empty cart. */
export function parseCart(raw: string | undefined): Cart {
  if (!raw) return EMPTY_CART;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

export function serializeCart(cart: Cart): string {
  return JSON.stringify(cart);
}

/** Adding from a different restaurant starts a new cart, because one order is from one restaurant. */
export function addToCart(cart: Cart, branchId: string, itemId: string): Cart {
  const base = cart.branchId === branchId ? cart : { branchId, lines: [] };
  const existing = base.lines.find((l) => l.id === itemId);
  if (!existing) return { branchId, lines: [...base.lines, { id: itemId, qty: 1 }] };
  return setQty(base, itemId, existing.qty + 1);
}

export function setQty(cart: Cart, itemId: string, qty: number): Cart {
  const clamped = Math.min(MAX_QTY, Math.floor(qty));
  const lines =
    clamped < 1
      ? cart.lines.filter((l) => l.id !== itemId)
      : cart.lines.map((l) => (l.id === itemId ? { ...l, qty: clamped } : l));
  return lines.length ? { ...cart, lines } : EMPTY_CART;
}

export function cartCount(cart: Cart): number {
  return cart.lines.reduce((n, l) => n + l.qty, 0);
}

export function qtyOf(cart: Cart, itemId: string): number {
  return cart.lines.find((l) => l.id === itemId)?.qty ?? 0;
}

export const TIP_OPTIONS_CENTS = [0, 1000, 2000, 3000] as const;

/** A redirect target from the query string. Only same-site paths, so sign in can't bounce to another site. */
export function safeNext(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\'))
    return fallback;
  return next;
}
