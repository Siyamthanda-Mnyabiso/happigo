import { BagIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { cartCount } from '@/lib/cart';
import { readCart } from '@/lib/cart-store';
import { routes } from '@/lib/routes';

/** Sits above the tab bar whenever the cart has something in it. */
export async function CartBar() {
  const count = cartCount(await readCart());
  if (!count) return null;
  return (
    <Link
      href={routes.customer.cart}
      className="fixed inset-x-0 bottom-[100px] z-10 mx-auto md:bottom-6 flex h-14 w-[calc(100%-32px)] max-w-[398px] md:max-w-md items-center justify-between rounded-full bg-brand px-6 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <span className="flex items-center gap-2">
        <BagIcon weight="bold" className="size-6" aria-hidden /> View cart
      </span>
      <span>
        {count} {count === 1 ? 'item' : 'items'}
      </span>
    </Link>
  );
}
