import 'server-only';
import { calcOrderTotals } from './pricing';
import { readCart } from './cart-store';
import { createClient } from './supabase/server';

/**
 * The cart as the customer sees it. The cookie only holds ids and quantities, so names and
 * prices always come from the database. Items that were removed or sold out since are dropped.
 */
export async function loadCartView() {
  const cart = await readCart();
  if (!cart.branchId || !cart.lines.length) return null;
  const supabase = await createClient();
  const [{ data: branch }, { data: items }] = await Promise.all([
    supabase
      .from('branches')
      .select('id, name, restaurant_id, accepting_orders')
      .eq('id', cart.branchId)
      .maybeSingle(),
    supabase
      .from('menu_items')
      .select('id, name, price_cents')
      .eq('branch_id', cart.branchId)
      .eq('available', true)
      .in(
        'id',
        cart.lines.map((l) => l.id),
      ),
  ]);
  if (!branch) return null;
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, delivery_fee_cents')
    .eq('id', branch.restaurant_id)
    .maybeSingle();
  if (!restaurant) return null;

  const lines = cart.lines.flatMap((l) => {
    const item = items?.find((i) => i.id === l.id);
    return item ? [{ item, qty: l.qty }] : [];
  });
  if (!lines.length) return null;
  const food = lines.reduce((sum, l) => sum + l.item.price_cents * l.qty, 0);
  const totals = calcOrderTotals({ food, deliveryFee: restaurant.delivery_fee_cents });
  return { branch, restaurant, lines, totals };
}
