import {
  BagIcon,
  CaretDownIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  SlidersHorizontalIcon,
} from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { RestaurantCard } from '@/components/shop/restaurant-card';
import { cartCount } from '@/lib/cart';
import { readCart } from '@/lib/cart-store';
import { HOME_CUISINES } from '@/lib/food';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';
import { getViewer } from '@/lib/viewer';

export default async function HomePage() {
  const supabase = await createClient();
  const [viewer, cart, { data: restaurants }] = await Promise.all([
    getViewer(),
    readCart(),
    supabase
      .from('restaurants')
      .select('id, name, cuisine, delivery_fee_cents, image_url')
      .order('name'),
  ]);
  const { data: last } = viewer
    ? await supabase
        .from('customer_addresses')
        .select('address')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };
  const count = cartCount(cart);

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          href={viewer ? routes.customer.addresses : routes.customer.signIn}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-peach text-brand">
            <MapPinIcon weight="bold" className="size-[22px]" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-base text-muted">Deliver to</span>
            <span className="flex items-center gap-1 font-semibold">
              <span className="truncate">{last?.address ?? 'Add your address'}</span>
              <CaretDownIcon weight="bold" className="size-4 shrink-0" aria-hidden />
            </span>
          </span>
        </Link>
        <Link
          href={routes.customer.cart}
          aria-label={count ? `Cart, ${count} items` : 'Cart'}
          className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-card"
        >
          <BagIcon weight="bold" className="size-[22px]" aria-hidden />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full border-2 border-card bg-brand text-sm font-bold leading-none text-white">
              {count}
            </span>
          )}
        </Link>
      </div>

      <h1 className="mt-6 text-[28px] font-extrabold leading-tight">
        {viewer?.firstName ? `Hungry, ${viewer.firstName}?` : 'Hungry?'}
      </h1>

      <form role="search" action={routes.customer.search} className="relative mt-4">
        <label htmlFor="q" className="sr-only">
          Search restaurants or dishes
        </label>
        <MagnifyingGlassIcon
          className="absolute left-[18px] top-1/2 size-[22px] -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          id="q"
          name="q"
          type="search"
          placeholder="Search restaurants or dishes"
          className="h-[54px] w-full rounded-[27px] bg-card pl-[52px] pr-14 text-base placeholder:text-[#a89e97] focus-visible:outline-2 focus-visible:outline-brand"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-2 top-1/2 flex size-[38px] -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white"
        >
          <SlidersHorizontalIcon weight="bold" className="size-[22px]" aria-hidden />
        </button>
      </form>

      <section
        aria-label="No service fee"
        className="relative mt-5 h-[148px] overflow-hidden rounded-[24px] bg-brand"
      >
        <Image
          src="/food/promo-banner.jpg"
          alt=""
          fill
          priority
          sizes="342px"
          className="object-cover"
        />
        <div className="relative p-5">
          <p className="max-w-[150px] text-[21px] font-extrabold leading-[25px] text-white">
            No service fee on every order
          </p>
          <Link
            href={routes.customer.search}
            className="mt-[26px] inline-flex h-[38px] items-center rounded-full bg-white px-6 text-base font-semibold text-brand"
          >
            Order now
          </Link>
        </div>
      </section>

      <nav aria-label="Cuisines" className="-mx-6 mt-6 overflow-x-auto px-6">
        <ul className="flex justify-between gap-4">
          {HOME_CUISINES.map((c) => (
            <li key={c.name}>
              <Link
                href={`${routes.customer.search}?cuisine=${encodeURIComponent(c.name)}`}
                className="flex w-[64px] flex-col items-center gap-2"
              >
                <span className="relative block size-[58px] overflow-hidden rounded-full">
                  <Image src={c.photo} alt="" fill sizes="58px" className="object-cover" />
                </span>
                <span className="text-base font-medium">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-7 flex items-baseline justify-between">
        <h2 className="text-xl font-extrabold">Restaurants</h2>
        <Link href={routes.customer.search} className="font-semibold text-brand">
          See all
        </Link>
      </div>
      {restaurants?.length ? (
        <ul className="-mx-6 mt-4 flex snap-x gap-4 overflow-x-auto px-6">
          {restaurants.map((r, i) => (
            <li key={r.id} className="shrink-0">
              <RestaurantCard r={r} priority={i === 0} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-[22px] bg-card p-5">
          <p className="font-bold">No restaurants yet</p>
          <p className="text-muted">New restaurants are joining soon. Check back shortly.</p>
        </div>
      )}

      <section aria-label="Restaurants and drivers" className="mt-10 grid gap-3">
        <Link href={routes.restaurant.signIn} className="rounded-[22px] bg-ink p-5 text-white">
          <p className="text-lg font-bold">Own a restaurant?</p>
          <p className="text-on-dark">One flat monthly fee. No commission on your orders.</p>
        </Link>
        <Link href={routes.driver.join} className="rounded-[22px] bg-card p-5">
          <p className="text-lg font-bold">Want to deliver?</p>
          <p className="text-muted">Free to join. You keep the delivery fee and tips.</p>
        </Link>
      </section>
    </>
  );
}
