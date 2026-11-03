import { BagIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { cartCount } from '@/lib/cart';
import { readCart } from '@/lib/cart-store';
import { routes } from '@/lib/routes';
import { getViewer } from '@/lib/viewer';

const NAV = [
  { href: routes.customer.home, label: 'Restaurants' },
  { href: routes.customer.orders, label: 'My orders' },
  { href: routes.customer.account, label: 'Account' },
];

export async function ShopHeader() {
  const [viewer, cart] = await Promise.all([getViewer(), readCart()]);
  const count = cartCount(cart);
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-5 md:px-8">
        <Link
          href={routes.customer.home}
          className="text-2xl font-extrabold tracking-tight text-brand"
        >
          HappiGo
        </Link>
        <nav aria-label="Main" className="ml-4 hidden gap-6 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="font-semibold text-ink hover:text-brand">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href={routes.customer.cart}
            aria-label={count ? `Cart, ${count} items` : 'Cart'}
            className="relative flex size-11 items-center justify-center rounded-full bg-card"
          >
            <BagIcon weight="bold" className="size-6" aria-hidden />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          {!viewer && (
            <Link
              href={routes.customer.signIn}
              className="flex h-11 items-center rounded-full bg-ink px-5 font-semibold text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
