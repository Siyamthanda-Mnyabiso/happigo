import { ArrowLeftIcon, PlusIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { Card } from '@/components/ui/layout';
import { qtyOf } from '@/lib/cart';
import { readCart } from '@/lib/cart-store';
import { formatRand } from '@/lib/money';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';
import { addItem } from '../../cart-actions';

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const id = z.guid().safeParse((await params).id);
  if (!id.success) notFound();
  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, cuisine, delivery_fee_cents')
    .eq('id', id.data)
    .maybeSingle();
  if (!restaurant) notFound(); // not listed, or does not exist. Customers can't tell which.

  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, address, accepting_orders')
    .eq('restaurant_id', restaurant.id)
    .order('name');
  const branch = branches?.find((b) => b.accepting_orders) ?? branches?.[0];
  if (!branch) notFound();

  const [{ data: items }, cart] = await Promise.all([
    supabase
      .from('menu_items')
      .select('id, name, description, price_cents, category, popular')
      .eq('branch_id', branch.id)
      .eq('available', true)
      .order('name'),
    readCart(),
  ]);

  const groups = new Map<string, NonNullable<typeof items>>();
  for (const item of items ?? []) {
    const key = item.popular ? 'Popular' : item.category;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  // Popular first, then the rest in the order the restaurant named them.
  const sections = [...groups.entries()].sort(
    ([a], [b]) => Number(b === 'Popular') - Number(a === 'Popular'),
  );

  return (
    <>
      <Link
        href={routes.customer.home}
        className="mb-4 inline-flex items-center gap-2 font-semibold text-muted"
      >
        <ArrowLeftIcon weight="bold" className="size-5" aria-hidden /> All restaurants
      </Link>
      <h1 className="text-3xl font-extrabold">{restaurant.name}</h1>
      <p className="mb-2 text-muted">
        {[
          restaurant.cuisine,
          `${formatRand(restaurant.delivery_fee_cents)} delivery`,
          'No service fee',
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {!branch.accepting_orders && (
        <Card tone="fill" className="my-4" role="status">
          <p className="font-bold">Not taking orders right now</p>
          <p className="text-muted">You can look at the menu. Come back soon to order.</p>
        </Card>
      )}

      {sections.length === 0 && (
        <p className="mt-6 text-muted">This menu is empty at the moment.</p>
      )}
      {sections.map(([category, list]) => (
        <section key={category} className="mt-6" aria-labelledby={`c-${category}`}>
          <h2 id={`c-${category}`} className="mb-3 text-xl font-bold">
            {category}
          </h2>
          <ul className="space-y-3">
            {list.map((item) => {
              const inCart = qtyOf(cart, item.id);
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-4 rounded-[22px] border border-line p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{item.name}</p>
                    {item.description && <p className="text-muted">{item.description}</p>}
                    <p className="mt-1 font-semibold">{formatRand(item.price_cents)}</p>
                  </div>
                  {branch.accepting_orders && (
                    <form action={addItem}>
                      <input type="hidden" name="branchId" value={branch.id} />
                      <input type="hidden" name="itemId" value={item.id} />
                      <button
                        type="submit"
                        aria-label={`Add ${item.name}${inCart ? `, ${inCart} in cart` : ''}`}
                        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        {inCart ? (
                          <span className="font-bold">{inCart}</span>
                        ) : (
                          <PlusIcon weight="bold" className="size-6" />
                        )}
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
