import Link from 'next/link';
import { Card } from '@/components/ui/layout';
import { formatRand } from '@/lib/money';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = ((await searchParams).q ?? '').trim().slice(0, 40);
  const supabase = await createClient();
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, cuisine, delivery_fee_cents')
    .order('name');
  // Filter in code: the list is small and this avoids building a query from user text.
  const needle = q.toLowerCase();
  const shown = (restaurants ?? []).filter(
    (r) =>
      !needle || r.name.toLowerCase().includes(needle) || r.cuisine?.toLowerCase().includes(needle),
  );

  return (
    <>
      <h1 className="mb-1 text-3xl font-extrabold">Hungry?</h1>
      <p className="mb-5 text-muted">Order straight from local restaurants. No service fee.</p>
      <form role="search" className="mb-6">
        <label htmlFor="q" className="sr-only">
          Search restaurants or food
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          type="search"
          placeholder="Search restaurants or food"
          className="h-14 w-full rounded-2xl bg-card px-4 text-base placeholder:text-muted focus-visible:outline-2 focus-visible:outline-brand"
        />
      </form>

      {shown.length === 0 ? (
        <Card tone="fill">
          <p className="font-bold">{q ? `No restaurants match "${q}"` : 'No restaurants yet'}</p>
          <p className="text-muted">
            {q ? 'Try another search.' : 'New restaurants are joining soon. Check back shortly.'}
          </p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {shown.map((r) => (
            <li key={r.id}>
              <Link
                href={routes.customer.restaurant(r.id)}
                className="block rounded-[22px] border border-line p-5 focus-visible:outline-2 focus-visible:outline-brand"
              >
                <p className="text-lg font-bold">{r.name}</p>
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
    </>
  );
}
