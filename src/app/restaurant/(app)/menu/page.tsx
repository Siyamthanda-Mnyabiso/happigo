import Link from 'next/link';
import { LinkButton } from '@/components/ui/button';
import { Card } from '@/components/ui/layout';
import { groupByCategory } from '@/lib/menu';
import { formatRand } from '@/lib/money';
import { getMainBranch } from '@/lib/restaurant';
import { routes } from '@/lib/routes';

export default async function MenuPage() {
  const { supabase, branch } = await getMainBranch();
  if (!branch) {
    return (
      <>
        <h1 className="mb-4 text-3xl font-extrabold">Menu</h1>
        <Card tone="fill">
          <p className="font-bold">Set up your store first</p>
          <p className="mb-4 text-muted">Add your address so customers know where you are.</p>
          <LinkButton href={routes.restaurant.store}>Go to Store</LinkButton>
        </Card>
      </>
    );
  }
  const { data } = await supabase
    .from('menu_items')
    .select('id, name, price_cents, category, available, popular, description')
    .eq('branch_id', branch.id)
    .order('name');
  const groups = groupByCategory(data ?? []);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Menu</h1>
        <Link
          href={routes.restaurant.menuNew}
          className="flex h-12 items-center rounded-full bg-brand px-5 font-semibold text-white"
        >
          Add item
        </Link>
      </div>
      {!groups.length ? (
        <Card tone="fill" className="text-muted">
          No items yet. Add your first one and customers can start ordering.
        </Card>
      ) : (
        groups.map((g) => (
          <section key={g.category} className="mb-6">
            <h2 className="mb-2 text-lg font-bold">{g.category}</h2>
            <ul className="divide-y divide-line border-y border-line">
              {g.items.map((i) => (
                <li key={i.id}>
                  <Link
                    href={routes.restaurant.menuItem(i.id)}
                    className="flex items-start justify-between gap-4 py-3"
                  >
                    <span>
                      <span className="block font-semibold">{i.name}</span>
                      {i.description && <span className="block text-muted">{i.description}</span>}
                      {!i.available && (
                        <span className="block font-semibold text-danger">Sold out</span>
                      )}
                    </span>
                    <span className="font-semibold">{formatRand(i.price_cents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
