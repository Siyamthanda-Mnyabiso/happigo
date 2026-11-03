import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/layout';
import { toRandInput } from '@/lib/money';
import { getMainBranch } from '@/lib/restaurant';
import { routes } from '@/lib/routes';
import { deleteItem, updateItem } from '../actions';
import { ItemForm } from '../item-form';

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirm?: string }>;
}) {
  const { id } = await params;
  const confirming = (await searchParams).confirm === 'delete';
  const { supabase } = await getMainBranch();
  const { data: item } = await supabase
    .from('menu_items')
    .select('id, name, price_cents, category, description, available, popular')
    .eq('id', id)
    .maybeSingle();
  if (!item) notFound();

  return (
    <>
      <h1 className="mb-4 text-xl font-bold">Edit item</h1>
      <ItemForm
        action={updateItem.bind(null, item.id)}
        submitLabel="Save"
        values={{
          name: item.name,
          price: toRandInput(item.price_cents),
          category: item.category,
          description: item.description ?? '',
          available: item.available,
          popular: item.popular,
        }}
      />
      <div className="mt-8">
        {confirming ? (
          <Card tone="fill">
            <p className="mb-3 font-bold">Delete {item.name}?</p>
            <p className="mb-4 text-muted">
              Customers will no longer see it. Past orders are not affected.
            </p>
            <form action={deleteItem.bind(null, item.id)} className="flex gap-3">
              <Link
                href={routes.restaurant.menuItem(item.id)}
                className="flex h-14 flex-1 items-center justify-center rounded-full border border-line font-semibold"
              >
                Cancel
              </Link>
              <Button type="submit" className="flex-1 bg-danger hover:bg-danger">
                Delete item
              </Button>
            </form>
          </Card>
        ) : (
          <Link
            href={`${routes.restaurant.menuItem(item.id)}?confirm=delete`}
            className="font-semibold text-danger"
          >
            Delete item
          </Link>
        )}
      </div>
    </>
  );
}
