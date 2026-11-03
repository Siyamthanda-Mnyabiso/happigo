import { MinusIcon, PlusIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { Button, LinkButton } from '@/components/ui/button';
import { Card } from '@/components/ui/layout';
import { loadCartView } from '@/lib/cart-view';
import { formatRand } from '@/lib/money';
import { routes } from '@/lib/routes';
import { changeQty, emptyCart } from '../cart-actions';
import { Totals } from '../totals';

function Step({
  itemId,
  qty,
  label,
  children,
}: {
  itemId: string;
  qty: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <form action={changeQty}>
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="qty" value={qty} />
      <button
        type="submit"
        aria-label={label}
        className="flex size-10 items-center justify-center rounded-full border border-line focus-visible:outline-2 focus-visible:outline-brand"
      >
        {children}
      </button>
    </form>
  );
}

export default async function CartPage() {
  const view = await loadCartView();
  if (!view) {
    return (
      <>
        <h1 className="mb-4 text-3xl font-extrabold">Your cart</h1>
        <Card tone="fill">
          <p className="font-bold">Your cart is empty</p>
          <p className="mb-3 text-muted">Pick a restaurant and add something tasty.</p>
          <Link href={routes.customer.home} className="font-semibold text-brand">
            Browse restaurants
          </Link>
        </Card>
      </>
    );
  }
  const { restaurant, lines, totals } = view;
  return (
    <>
      <h1 className="text-3xl font-extrabold">Your cart</h1>
      <p className="mb-5 text-muted">
        From{' '}
        <Link href={routes.customer.restaurant(restaurant.id)} className="font-semibold text-ink">
          {restaurant.name}
        </Link>
      </p>
      <ul className="mb-6 space-y-3">
        {lines.map(({ item, qty }) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-[22px] border border-line p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold">{item.name}</p>
              <p className="text-muted">{formatRand(item.price_cents * qty)}</p>
            </div>
            <Step itemId={item.id} qty={qty - 1} label={`Remove one ${item.name}`}>
              <MinusIcon weight="bold" className="size-5" />
            </Step>
            <span className="w-6 text-center font-bold" aria-label={`${qty} in cart`}>
              {qty}
            </span>
            <Step itemId={item.id} qty={qty + 1} label={`Add one ${item.name}`}>
              <PlusIcon weight="bold" className="size-5" />
            </Step>
          </li>
        ))}
      </ul>
      <Card tone="fill" className="mb-6">
        <Totals food={totals.food} deliveryFee={totals.deliveryFee} />
      </Card>
      <LinkButton href={routes.customer.checkout}>Go to checkout</LinkButton>
      <form action={emptyCart} className="mt-3">
        <Button type="submit" variant="secondary">
          Empty cart
        </Button>
      </form>
    </>
  );
}
