import { notFound } from 'next/navigation';
import { z } from 'zod';
import { FoodPhoto } from '@/components/food-photo';
import { BackButton } from '@/components/shop/back-button';
import { formatRand } from '@/lib/money';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';
import { QtyAdd } from './qty-add';

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const p = await params;
  const ids = z.object({ id: z.guid(), itemId: z.guid() }).safeParse(p);
  if (!ids.success) notFound();
  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('id', ids.data.id)
    .maybeSingle();
  const { data: item } = await supabase
    .from('menu_items')
    .select('id, branch_id, name, description, price_cents, category, image_url')
    .eq('id', ids.data.itemId)
    .eq('available', true)
    .maybeSingle();
  if (!restaurant || !item) notFound();
  const { data: branch } = await supabase
    .from('branches')
    .select('id, restaurant_id, accepting_orders')
    .eq('id', item.branch_id)
    .maybeSingle();
  if (!branch || branch.restaurant_id !== restaurant.id) notFound();

  return (
    <div className="pb-32">
      <div className="relative h-[300px] bg-card">
        <FoodPhoto
          src={item.image_url}
          hint={`${item.category} ${item.name}`}
          seed={item.name}
          sizes="430px"
          emojiClass="text-[9rem]"
          priority
        />
        <BackButton
          href={routes.customer.restaurant(restaurant.id)}
          label={`Back to ${restaurant.name}`}
          className="absolute left-6 top-12"
        />
      </div>
      <div className="relative -mt-8 rounded-t-[32px] bg-white px-6 pt-7">
        <h1 className="text-[28px] font-extrabold leading-tight">{item.name}</h1>
        <p className="mt-1 text-xl font-bold text-brand">{formatRand(item.price_cents)}</p>
        {item.description && <p className="mt-3 text-muted">{item.description}</p>}
        <p className="mt-6 text-muted">From {restaurant.name}</p>
      </div>
      <QtyAdd
        branchId={branch.id}
        itemId={item.id}
        menuHref={routes.customer.restaurant(restaurant.id)}
        priceCents={item.price_cents}
        disabled={!branch.accepting_orders}
      />
    </div>
  );
}
