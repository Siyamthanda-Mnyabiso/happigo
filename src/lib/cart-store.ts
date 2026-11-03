import 'server-only';
import { cookies } from 'next/headers';
import { type Cart, EMPTY_CART, parseCart, serializeCart } from './cart';

const NAME = 'hg_cart';

export async function readCart(): Promise<Cart> {
  return parseCart((await cookies()).get(NAME)?.value);
}

export async function writeCart(cart: Cart) {
  const jar = await cookies();
  if (!cart.lines.length) return jar.delete(NAME);
  jar.set(NAME, serializeCart(cart), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearCart() {
  await writeCart(EMPTY_CART);
}
