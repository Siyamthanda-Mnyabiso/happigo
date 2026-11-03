import Link from 'next/link';
import { loadCartView } from '@/lib/cart-view';
import { formatRand } from '@/lib/money';
import { routes } from '@/lib/routes';

/** The orange "View cart" bar along the bottom of the menu screens. Only shows for the restaurant you are in. */
export async function ViewCartBar({ branchId }: { branchId: string }) {
  const view = await loadCartView();
  if (!view || view.branch.id !== branchId) return null;
  const count = view.lines.reduce((n, l) => n + l.qty, 0);
  return (
    <Link
      href={routes.customer.cart}
      className="fixed inset-x-0 bottom-4 z-10 mx-auto flex h-16 w-[calc(100%-32px)] max-w-[398px] items-center gap-3 rounded-full bg-brand px-4 text-white shadow-[0_8px_16px_rgba(248,58,3,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-white/25 text-lg font-bold">
        {count}
      </span>
      <span className="flex-1 text-lg font-semibold">View cart</span>
      <span className="pr-2 text-lg font-bold">{formatRand(view.totals.food)}</span>
    </Link>
  );
}
