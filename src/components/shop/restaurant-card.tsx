import Link from 'next/link';
import { FoodPhoto } from '@/components/food-photo';
import { formatRand } from '@/lib/money';
import { routes } from '@/lib/routes';

export type RestaurantSummary = {
  id: string;
  name: string;
  cuisine: string | null;
  delivery_fee_cents: number;
  image_url: string | null;
};

/** Photo card from the design. `wide` is the full width version used in search results. */
export function RestaurantCard({
  r,
  wide,
  priority,
}: {
  r: RestaurantSummary;
  wide?: boolean;
  priority?: boolean;
}) {
  return (
    <Link
      href={routes.customer.restaurant(r.id)}
      className={`block shrink-0 snap-start focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${wide ? 'w-full' : 'w-[230px]'}`}
    >
      <div
        className={`relative overflow-hidden rounded-[20px] ${wide ? 'h-[150px]' : 'h-[132px]'}`}
      >
        <FoodPhoto
          src={r.image_url}
          hint={r.cuisine ?? r.name}
          seed={r.name}
          sizes={wide ? '342px' : '230px'}
          emojiClass="text-7xl"
          priority={priority}
        />
      </div>
      <p className="mt-3 text-[17px] font-bold">{r.name}</p>
      <p className="text-muted">
        {[r.cuisine, `${formatRand(r.delivery_fee_cents)} delivery`].filter(Boolean).join(' · ')}
      </p>
    </Link>
  );
}
