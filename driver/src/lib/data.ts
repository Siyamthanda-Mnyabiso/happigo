import { useQuery } from '@tanstack/react-query';
import { periodStart } from '@core/delivery';
import { supabase } from '@native/supabase';

export type Offer = {
  order_id: string;
  restaurant_name: string;
  pickup_address: string | null;
  item_count: number;
  distance_km: number | null;
  driver_pay_cents: number;
  tip_cents: number;
  status: string;
};

/** Deliveries this driver can take right now. Refreshes every 10 seconds while the driver is online. */
export function useOffers(uid: string | undefined, online: boolean) {
  return useQuery({
    queryKey: ['offers', uid],
    enabled: !!uid && online,
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('driver_available_deliveries');
      if (error) throw error;
      return data as Offer[];
    },
  });
}

/** The delivery this driver is carrying, if any. */
export function useActiveDelivery(uid: string | undefined) {
  return useQuery({
    queryKey: ['active', uid],
    enabled: !!uid,
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .eq('driver_id', uid!)
        .in('status', ['preparing', 'ready', 'picked_up'])
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
  });
}

export type Delivered = { id: string; driver_pay_cents: number | null; tip_cents: number; delivered_at: string | null; restaurant: string };

/** Everything delivered since the start of this week or month, whichever is earlier. The screens slice it by period. */
export function useDelivered(uid: string | undefined) {
  return useQuery({
    queryKey: ['delivered', uid],
    enabled: !!uid,
    queryFn: async (): Promise<Delivered[]> => {
      const now = Date.now();
      const from = new Date(Math.min(periodStart('week', now).getTime(), periodStart('month', now).getTime()));
      const { data, error } = await supabase
        .from('orders')
        .select('id, driver_pay_cents, tip_cents, delivered_at, branches(restaurants(name))')
        .eq('driver_id', uid!)
        .eq('status', 'delivered')
        .gte('delivered_at', from.toISOString())
        .order('delivered_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        driver_pay_cents: r.driver_pay_cents,
        tip_cents: r.tip_cents,
        delivered_at: r.delivered_at,
        restaurant: r.branches?.restaurants?.name ?? 'Delivery',
      }));
    },
  });
}
