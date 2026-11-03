import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { BackButton } from '@/components/shop/back-button';
import { RestaurantCard } from '@/components/shop/restaurant-card';
import { HOME_CUISINES } from '@/lib/food';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cuisine?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 40);
  const cuisine = HOME_CUISINES.find((c) => c.name === sp.cuisine)?.name;
  const supabase = await createClient();
  const { data } = await supabase
    .from('restaurants')
    .select('id, name, cuisine, delivery_fee_cents, image_url')
    .order('name');
  // Filter in code: the list is small and this avoids building a query from user text.
  const needle = q.toLowerCase();
  const shown = (data ?? []).filter(
    (r) =>
      (!cuisine || r.cuisine?.toLowerCase().includes(cuisine.toLowerCase())) &&
      (!needle ||
        r.name.toLowerCase().includes(needle) ||
        r.cuisine?.toLowerCase().includes(needle)),
  );
  const pill = (active: boolean) =>
    `inline-flex h-11 items-center rounded-full border-[1.5px] px-5 font-semibold ${active ? 'border-brand bg-brand text-white' : 'border-line'}`;

  return (
    <>
      <div className="flex items-center gap-3">
        <BackButton href={routes.customer.home} />
        <form role="search" className="relative flex-1">
          <label htmlFor="q" className="sr-only">
            Search restaurants or dishes
          </label>
          <MagnifyingGlassIcon
            className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search restaurants or dishes"
            className="h-12 w-full rounded-3xl bg-card pl-11 pr-11 text-base placeholder:text-[#a89e97] focus-visible:outline-2 focus-visible:outline-brand"
          />
          {cuisine && <input type="hidden" name="cuisine" value={cuisine} />}
          {q && (
            <Link
              href={
                cuisine
                  ? `${routes.customer.search}?cuisine=${encodeURIComponent(cuisine)}`
                  : routes.customer.search
              }
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-line"
            >
              <XIcon weight="bold" className="size-3.5" aria-hidden />
            </Link>
          )}
        </form>
      </div>

      <nav aria-label="Cuisines" className="-mx-6 mt-4 overflow-x-auto px-6">
        <ul className="flex gap-2">
          <li>
            <Link
              href={
                q ? `${routes.customer.search}?q=${encodeURIComponent(q)}` : routes.customer.search
              }
              className={pill(!cuisine)}
            >
              All
            </Link>
          </li>
          {HOME_CUISINES.map((c) => (
            <li key={c.name}>
              <Link
                href={`${routes.customer.search}?cuisine=${encodeURIComponent(c.name)}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                aria-current={c.name === cuisine ? 'true' : undefined}
                className={pill(c.name === cuisine)}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="mb-4 mt-5 text-muted" role="status">
        {shown.length} {shown.length === 1 ? 'restaurant' : 'restaurants'}
      </p>
      {shown.length === 0 ? (
        <div className="rounded-[22px] bg-card p-5">
          <p className="font-bold">Nothing matches that</p>
          <p className="text-muted">Try another search or cuisine.</p>
        </div>
      ) : (
        <ul className="space-y-6">
          {shown.map((r) => (
            <li key={r.id}>
              <RestaurantCard r={r} wide />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
