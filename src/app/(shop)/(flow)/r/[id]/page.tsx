import { PlusIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { FoodPhoto } from '@/components/food-photo';
import { BackButton } from '@/components/shop/back-button';
import { ViewCartBar } from '@/components/shop/view-cart-bar';
import { qtyOf } from '@/lib/cart';
import { readCart } from '@/lib/cart-store';
import { formatRand } from '@/lib/money';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';
import { addItem } from '@/app/(shop)/cart-actions';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const id = z.guid().safeParse((await params).id);
  if (!id.success) notFound();
  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, cuisine, delivery_fee_cents, image_url')
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
      .select('id, name, description, price_cents, category, popular, image_url')
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
  const sections = [...groups.entries()].sort(
    ([a], [b]) => Number(b === 'Popular') - Number(a === 'Popular'),
  );

  return (
    <div className="pb-28">
      <div className="relative h-[240px] bg-card">
        <FoodPhoto
          src={restaurant.image_url}
          hint={restaurant.cuisine ?? restaurant.name}
          seed={restaurant.name}
          sizes="430px"
          emojiClass="text-[8rem]"
          priority
        />
        <BackButton
          href={routes.customer.home}
          label="Back to restaurants"
          className="absolute left-6 top-12"
        />
      </div>

      <div className="relative -mt-8 rounded-t-[32px] bg-white px-6 pt-6">
        <h1 className="text-[28px] font-extrabold leading-tight">{restaurant.name}</h1>
        <p className="mt-1 text-muted">
          {[
            restaurant.cuisine,
            `${formatRand(restaurant.delivery_fee_cents)} delivery`,
            'No service fee',
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {!branch.accepting_orders && (
          <div role="status" className="mt-4 rounded-[22px] bg-card p-5">
            <p className="font-bold">Not taking orders right now</p>
            <p className="text-muted">You can look at the menu. Come back soon to order.</p>
          </div>
        )}

        {sections.length > 1 && (
          <nav
            aria-label="Menu sections"
            className="sticky top-0 z-10 -mx-6 mt-4 overflow-x-auto bg-white px-6 py-3"
          >
            <ul className="flex gap-2">
              {sections.map(([category], i) => (
                <li key={category}>
                  <a
                    href={`#c-${slug(category)}`}
                    className={`inline-flex h-11 items-center rounded-full border-[1.5px] px-5 font-semibold ${
                      i === 0 ? 'border-brand bg-brand text-white' : 'border-line'
                    }`}
                  >
                    {category}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {sections.length === 0 && (
          <p className="mt-6 text-muted">This menu is empty at the moment.</p>
        )}
        {sections.map(([category, list]) => (
          <section
            key={category}
            id={`c-${slug(category)}`}
            aria-labelledby={`h-${slug(category)}`}
            className="mt-4 scroll-mt-16"
          >
            <h2 id={`h-${slug(category)}`} className="mb-3 text-xl font-extrabold">
              {category}
            </h2>
            <ul className="space-y-5">
              {list.map((item) => {
                const inCart = qtyOf(cart, item.id);
                return (
                  <li key={item.id} className="flex gap-4">
                    <Link
                      href={routes.customer.item(restaurant.id, item.id)}
                      className="min-w-0 flex-1"
                    >
                      <p className="text-[17px] font-bold">{item.name}</p>
                      {item.description && (
                        <p className="line-clamp-2 text-muted">{item.description}</p>
                      )}
                      <p className="mt-1 text-[17px] font-bold">{formatRand(item.price_cents)}</p>
                    </Link>
                    <div className="relative h-[90px] w-[100px] shrink-0">
                      <Link
                        href={routes.customer.item(restaurant.id, item.id)}
                        aria-label={`${item.name} details`}
                        className="relative block size-full overflow-hidden rounded-2xl"
                      >
                        <FoodPhoto
                          src={item.image_url}
                          hint={`${item.category} ${item.name}`}
                          seed={item.name}
                          sizes="100px"
                          emojiClass="text-4xl"
                        />
                      </Link>
                      {branch.accepting_orders && (
                        <form action={addItem} className="absolute -bottom-2 -right-2">
                          <input type="hidden" name="branchId" value={branch.id} />
                          <input type="hidden" name="itemId" value={item.id} />
                          <button
                            type="submit"
                            aria-label={`Add ${item.name}${inCart ? `, ${inCart} in cart` : ''}`}
                            className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-brand text-white shadow-[0_2px_6px_rgba(248,58,3,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                          >
                            {inCart ? (
                              <span className="font-bold">{inCart}</span>
                            ) : (
                              <PlusIcon weight="bold" className="size-5" />
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <ViewCartBar branchId={branch.id} />
    </div>
  );
}
