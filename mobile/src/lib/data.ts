import { useQuery } from '@tanstack/react-query';
import { calcOrderTotals } from '@core/pricing';
import type { Cart } from '@core/cart';
import { supabase } from './supabase';

export type RestaurantSummary = {
  id: string;
  name: string;
  cuisine: string | null;
  delivery_fee_cents: number;
  image_url: string | null;
};

/** Listed restaurants. Row level security already hides the ones that are not set up yet. */
export function useRestaurants() {
  return useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, cuisine, delivery_fee_cents, image_url')
        .order('name');
      if (error) throw error;
      return data as RestaurantSummary[];
    },
  });
}

export function useRestaurantMenu(restaurantId: string) {
  return useQuery({
    queryKey: ['menu', restaurantId],
    queryFn: async () => {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id, name, cuisine, delivery_fee_cents, image_url')
        .eq('id', restaurantId)
        .maybeSingle();
      if (!restaurant) return null;
      const { data: branches } = await supabase
        .from('branches')
        .select('id, name, address, accepting_orders')
        .eq('restaurant_id', restaurantId)
        .order('name');
      const branch = branches?.find((b) => b.accepting_orders) ?? branches?.[0];
      if (!branch) return null;
      const { data: items } = await supabase
        .from('menu_items')
        .select('id, name, description, price_cents, category, popular, image_url')
        .eq('branch_id', branch.id)
        .eq('available', true)
        .order('name');
      return { restaurant, branch, items: items ?? [] };
    },
  });
}

/** The cart as the customer sees it: names and prices come from the database, never from the device. */
export function useCartView(cart: Cart) {
  const ids = cart.lines.map((l) => l.id).join(',');
  return useQuery({
    queryKey: ['cart-view', cart.branchId, ids],
    enabled: !!cart.branchId && cart.lines.length > 0,
    queryFn: async () => {
      const { data: branch } = await supabase
        .from('branches')
        .select('id, name, restaurant_id, accepting_orders')
        .eq('id', cart.branchId!)
        .maybeSingle();
      if (!branch) return null;
      const [{ data: restaurant }, { data: items }] = await Promise.all([
        supabase.from('restaurants').select('id, name, cuisine, image_url, delivery_fee_cents').eq('id', branch.restaurant_id).maybeSingle(),
        supabase
          .from('menu_items')
          .select('id, name, price_cents, image_url, category')
          .eq('branch_id', branch.id)
          .eq('available', true)
          .in('id', cart.lines.map((l) => l.id)),
      ]);
      if (!restaurant) return null;
      const lines = cart.lines.flatMap((l) => {
        const item = items?.find((i) => i.id === l.id);
        return item ? [{ item, qty: l.qty }] : [];
      });
      if (!lines.length) return null;
      const food = lines.reduce((sum, l) => sum + l.item.price_cents * l.qty, 0);
      return { branch, restaurant, lines, totals: calcOrderTotals({ food, deliveryFee: restaurant.delivery_fee_cents }) };
    },
  });
}
