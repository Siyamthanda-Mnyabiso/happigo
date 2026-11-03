import { useQuery } from '@tanstack/react-query';
import { periodStart } from '@core/delivery';
import { supabase } from '@native/supabase';

export type OrderRow = {
  id: string;
  status: string;
  food_cents: number;
  created_at: string;
  customer_name: string | null;
  prep_minutes: number | null;
  accepted_at: string | null;
  order_items: { name: string; quantity: number }[];
};

/** Open orders plus everything from today, so the Done tab and today's totals have data. Refreshes every 10 seconds. */
export function useOrders(uid: string | undefined) {
  return useQuery({
    queryKey: ['orders', uid],
    enabled: !!uid,
    refetchInterval: 10_000,
    queryFn: async () => {
      const since = periodStart('today', Date.now()).toISOString();
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, food_cents, created_at, customer_name, prep_minutes, accepted_at, order_items(name, quantity)')
        .or(`status.in.(new,preparing,ready),created_at.gte.${since}`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as OrderRow[];
    },
  });
}

export type Sale = { id: string; food_cents: number; delivered_at: string | null };

/** Delivered orders since the start of this week or month, whichever is earlier. */
export function useSales(uid: string | undefined) {
  return useQuery({
    queryKey: ['sales', uid],
    enabled: !!uid,
    queryFn: async (): Promise<Sale[]> => {
      const now = Date.now();
      const from = new Date(Math.min(periodStart('week', now).getTime(), periodStart('month', now).getTime()));
      const { data, error } = await supabase
        .from('orders')
        .select('id, food_cents, delivered_at')
        .eq('status', 'delivered')
        .gte('delivered_at', from.toISOString());
      if (error) throw error;
      return data;
    },
  });
}

export function usePayouts(restaurantId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ['payouts', restaurantId, limit],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payouts')
        .select('id, amount_cents, paid_on, status')
        .eq('restaurant_id', restaurantId!)
        .order('paid_on', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}
