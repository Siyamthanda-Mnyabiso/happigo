import { ArrowRightIcon, MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { FoodPhoto } from '@/components/food-photo';
import { emojiFor } from '@/lib/food';
import { formatRand } from '@/lib/money';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';
import { getViewer } from '@/lib/viewer';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cuisine?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 40);
  const supabase = await createClient();
  const [viewer, { data }] = await Promise.all([
    getViewer(),
    supabase
      .from('restaurants')
      .select('id, name, cuisine, delivery_fee_cents, image_url')
      .order('name'),
  ]);
  const all = data ?? [];
  const cuisines = [...new Set(all.map((r) => r.cuisine).filter((c): c is string => !!c))].sort();
  const cuisine = cuisines.find((c) => c === sp.cuisine);

  // Filter in code: the list is small and this avoids building a query from user text.
  const needle = q.toLowerCase();
  const shown = all.filter(
    (r) =>
      (!cuisine || r.cuisine === cuisine) &&
      (!needle ||
        r.name.toLowerCase().includes(needle) ||
        r.cuisine?.toLowerCase().includes(needle)),
  );
  const filtered = !!(q || cuisine);

  return (
    <>
      <h1 className="text-3xl font-extrabold md:text-4xl">
        {viewer?.firstName ? `Hungry, ${viewer.firstName}?` : 'Hungry?'}
      </h1>
      <p className="mb-5 text-muted">Order straight from local restaurants.</p>

      <form role="search" className="relative mb-6 md:max-w-xl">
        <label htmlFor="q" className="sr-only">
          Search restaurants or dishes
        </label>
        <MagnifyingGlassIcon
          className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          id="q"
          name="q"
          defaultValue={q}
          type="search"
          placeholder="Search restaurants or dishes"
          className="h-14 w-full rounded-full bg-card pl-12 pr-4 text-base placeholder:text-muted focus-visible:outline-2 focus-visible:outline-brand"
        />
        {cuisine && <input type="hidden" name="cuisine" value={cuisine} />}
      </form>

      {!filtered && (
        <section
          aria-label="Why HappiGo"
          className="relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#ff6a2b] to-brand p-6 text-white md:p-10"
        >
          <p className="max-w-[16ch] text-3xl font-extrabold leading-tight md:max-w-[22ch] md:text-5xl">
            Local food. No service fee.
          </p>
          <p className="mt-2 max-w-md text-white/90">
            Restaurants keep what they earn, so you pay the food and the delivery. Nothing hidden at
            checkout.
          </p>
          <a
            href="#restaurants"
            className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-brand"
          >
            Order now <ArrowRightIcon weight="bold" className="size-5" aria-hidden />
          </a>
          <span
            aria-hidden
            className="absolute -bottom-4 right-4 text-[7rem] leading-none md:right-12 md:text-[11rem]"
          >
            🍔
          </span>
        </section>
      )}

      {cuisines.length > 0 && (
        <nav aria-label="Cuisines" className="-mx-5 mb-8 overflow-x-auto px-5 md:mx-0 md:px-0">
          <ul className="flex gap-4">
            {[null, ...cuisines].map((c) => {
              const active = (c ?? undefined) === cuisine;
              return (
                <li key={c ?? 'all'}>
                  <Link
                    href={
                      c
                        ? `${routes.customer.home}?cuisine=${encodeURIComponent(c)}`
                        : routes.customer.home
                    }
                    aria-current={active ? 'true' : undefined}
                    className="flex w-20 flex-col items-center gap-2"
                  >
                    <span
                      className={`flex size-16 items-center justify-center rounded-full text-3xl ${
                        active ? 'bg-brand ring-4 ring-brand/20' : 'bg-card'
                      }`}
                    >
                      {c ? emojiFor(c) : '🍽️'}
                    </span>
                    <span
                      className={`text-center text-base ${active ? 'font-bold text-brand' : 'font-medium'}`}
                    >
                      {c ?? 'All'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <section id="restaurants" aria-labelledby="rest-h" className="scroll-mt-24">
        <h2 id="rest-h" className="mb-4 text-2xl font-extrabold">
          {cuisine ? cuisine : q ? `Results for "${q}"` : 'Restaurants'}
        </h2>
        {shown.length === 0 ? (
          <div className="rounded-[22px] bg-card p-6">
            <p className="font-bold">
              {filtered ? 'No restaurants match that' : 'No restaurants yet'}
            </p>
            <p className="text-muted">
              {filtered
                ? 'Try another search or cuisine.'
                : 'New restaurants are joining soon. Check back shortly.'}
            </p>
            {filtered && (
              <Link
                href={routes.customer.home}
                className="mt-3 inline-block font-semibold text-brand"
              >
                Show all restaurants
              </Link>
            )}
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((r, i) => (
              <li key={r.id}>
                <Link
                  href={routes.customer.restaurant(r.id)}
                  className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[24px]">
                    <FoodPhoto
                      src={r.image_url}
                      alt=""
                      hint={r.cuisine}
                      seed={r.name}
                      sizes="(min-width:1024px) 360px, (min-width:640px) 45vw, 100vw"
                      emojiClass="text-7xl"
                      priority={i < 2}
                    />
                  </div>
                  <p className="mt-3 text-lg font-bold group-hover:text-brand">{r.name}</p>
                  <p className="text-muted">
                    {[r.cuisine, `${formatRand(r.delivery_fee_cents)} delivery`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="For restaurants and drivers" className="mt-14 grid gap-4 md:grid-cols-2">
        <Link href={routes.restaurant.signIn} className="rounded-[22px] bg-ink p-6 text-white">
          <p className="text-xl font-bold">Own a restaurant?</p>
          <p className="text-on-dark">One flat monthly fee. No commission on your orders.</p>
        </Link>
        <Link href={routes.driver.join} className="rounded-[22px] bg-card p-6">
          <p className="text-xl font-bold">Want to deliver?</p>
          <p className="text-muted">Free to join. You keep the delivery fee and tips.</p>
        </Link>
      </section>
    </>
  );
}
