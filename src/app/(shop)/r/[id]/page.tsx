import { ArrowLeftIcon, BicycleIcon, PlusIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { FoodPhoto } from '@/components/food-photo';
import { qtyOf } from '@/lib/cart';
import { readCart } from '@/lib/cart-store';
import { formatRand } from '@/lib/money';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';
import { addItem } from '../../cart-actions';

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
    <div className="-mx-5 -mt-6 md:mx-0 md:mt-0">
      <div className="relative h-56 overflow-hidden bg-card md:h-72 md:rounded-[28px]">
        <FoodPhoto
          src={restaurant.image_url}
          alt=""
          hint={restaurant.cuisine}
          seed={restaurant.name}
          sizes="(min-width:1152px) 1152px, 100vw"
          emojiClass="text-[9rem]"
          priority
        />
        <Link
          href={routes.customer.home}
          aria-label="Back to all restaurants"
          className="absolute left-5 top-5 flex size-11 items-center justify-center rounded-full bg-white shadow"
        >
          <ArrowLeftIcon weight="bold" className="size-5" aria-hidden />
        </Link>
      </div>

      <div className="relative -mt-8 rounded-t-[32px] bg-white px-5 pt-6 md:mt-0 md:px-0">
        <h1 className="text-3xl font-extrabold md:text-4xl">{restaurant.name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 text-muted">
          {restaurant.cuisine && <span>{restaurant.cuisine}</span>}
          <span className="inline-flex items-center gap-1">
            <BicycleIcon className="size-5" aria-hidden />{' '}
            {formatRand(restaurant.delivery_fee_cents)} delivery
          </span>
          <span>No service fee</span>
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
            className="sticky top-16 z-10 -mx-5 mt-5 overflow-x-auto bg-white px-5 py-3 md:mx-0 md:px-0"
          >
            <ul className="flex gap-2">
              {sections.map(([category], i) => (
                <li key={category}>
                  <a
                    href={`#c-${slug(category)}`}
                    className={`inline-flex h-11 items-center rounded-full border px-5 font-semibold ${
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
            className="mt-6 scroll-mt-36"
            id={`c-${slug(category)}`}
            aria-labelledby={`h-${slug(category)}`}
          >
            <h2 id={`h-${slug(category)}`} className="mb-4 text-2xl font-extrabold">
              {category}
            </h2>
            <ul className="grid gap-x-10 gap-y-6 md:grid-cols-2">
              {list.map((item) => {
                const inCart = qtyOf(cart, item.id);
                return (
                  <li key={item.id} className="flex gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold">{item.name}</p>
                      {item.description && (
                        <p className="line-clamp-2 text-muted">{item.description}</p>
                      )}
                      <p className="mt-2 text-lg font-bold">{formatRand(item.price_cents)}</p>
                    </div>
                    <div className="relative size-28 shrink-0">
                      <div className="relative size-full overflow-hidden rounded-[20px]">
                        <FoodPhoto
                          src={item.image_url}
                          alt=""
                          hint={`${item.category} ${item.name}`}
                          seed={item.name}
                          sizes="112px"
                          emojiClass="text-5xl"
                        />
                      </div>
                      {branch.accepting_orders && (
                        <form action={addItem} className="absolute -bottom-2 -right-2">
                          <input type="hidden" name="branchId" value={branch.id} />
                          <input type="hidden" name="itemId" value={item.id} />
                          <button
                            type="submit"
                            aria-label={`Add ${item.name}${inCart ? `, ${inCart} in cart` : ''}`}
                            className="flex size-11 items-center justify-center rounded-full border-2 border-white bg-brand text-white shadow hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                          >
                            {inCart ? (
                              <span className="font-bold">{inCart}</span>
                            ) : (
                              <PlusIcon weight="bold" className="size-6" />
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
    </div>
  );
}
