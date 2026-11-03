import { MinusIcon, PlusIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { FoodPhoto } from '@/components/food-photo';
import { PageHeader } from '@/components/shop/page-header';
import { LinkButton } from '@/components/ui/button';
import { loadCartView } from '@/lib/cart-view';
import { formatRand } from '@/lib/money';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';
import { changeQty, emptyCart } from '@/app/(shop)/cart-actions';
import { Totals } from '../../totals';

function Step({
  itemId,
  qty,
  label,
  children,
  filled,
}: {
  itemId: string;
  qty: number;
  label: string;
  children: React.ReactNode;
  filled?: boolean;
}) {
  return (
    <form action={changeQty}>
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="qty" value={qty} />
      <button
        type="submit"
        aria-label={label}
        className={`flex size-8 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-brand ${filled ? 'bg-brand text-white' : ''}`}
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
      <div className="px-6 pt-12">
        <PageHeader title="Your cart" back={routes.customer.home} />
        <div className="mt-8 rounded-[22px] bg-card p-6 text-center">
          <p className="text-lg font-bold">Your cart is empty</p>
          <p className="mb-4 text-muted">Pick a restaurant and add something tasty.</p>
          <LinkButton href={routes.customer.home}>Browse restaurants</LinkButton>
        </div>
      </div>
    );
  }
  const { restaurant, lines, totals } = view;
  const supabase = await createClient();
  const { data: meta } = await supabase
    .from('restaurants')
    .select('cuisine, image_url')
    .eq('id', restaurant.id)
    .maybeSingle();

  return (
    <div className="px-6 pb-32 pt-12">
      <PageHeader title="Your cart" back={routes.customer.restaurant(restaurant.id)} />

      <div className="mt-5 flex items-center gap-3">
        <span className="relative block size-8 overflow-hidden rounded-full">
          <FoodPhoto
            src={meta?.image_url ?? null}
            hint={meta?.cuisine ?? restaurant.name}
            seed={restaurant.name}
            sizes="32px"
            emojiClass="text-base"
          />
        </span>
        <p className="flex-1 font-semibold">{restaurant.name}</p>
        <Link href={routes.customer.restaurant(restaurant.id)} className="font-semibold text-brand">
          Add more
        </Link>
      </div>

      <ul className="mt-4 divide-y divide-line">
        {lines.map(({ item, qty, image_url, category }) => (
          <li key={item.id} className="flex gap-4 py-4 first:pt-0">
            <span className="relative block size-[84px] shrink-0 overflow-hidden rounded-xl">
              <FoodPhoto
                src={image_url}
                hint={`${category} ${item.name}`}
                seed={item.name}
                sizes="84px"
                emojiClass="text-3xl"
              />
            </span>
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <p className="text-[17px] font-semibold">{item.name}</p>
              <div className="flex items-end justify-between">
                <p className="text-[17px] font-bold">{formatRand(item.price_cents * qty)}</p>
                <div className="flex items-center rounded-full bg-card p-1">
                  <Step itemId={item.id} qty={qty - 1} label={`Remove one ${item.name}`}>
                    <MinusIcon weight="bold" className="size-4" />
                  </Step>
                  <span className="w-7 text-center font-semibold" aria-label={`${qty} in cart`}>
                    {qty}
                  </span>
                  <Step itemId={item.id} qty={qty + 1} label={`Add one ${item.name}`} filled>
                    <PlusIcon weight="bold" className="size-4" />
                  </Step>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-line pt-5">
        <Totals food={totals.food} deliveryFee={totals.deliveryFee} />
      </div>
      <p className="mt-5 text-muted">
        No service fee. Your payment goes straight to {restaurant.name}.
      </p>
      <form action={emptyCart} className="mt-4">
        <button type="submit" className="font-semibold text-muted underline underline-offset-4">
          Empty cart
        </button>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[430px] bg-gradient-to-t from-white from-70% to-transparent px-6 pb-6 pt-6">
        <LinkButton
          href={routes.customer.checkout}
          className="shadow-[0_8px_8px_rgba(247,59,3,0.35)]"
        >
          Go to checkout
        </LinkButton>
      </div>
    </div>
  );
}
