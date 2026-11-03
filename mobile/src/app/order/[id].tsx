import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { User } from 'phosphor-react-native';
import { ScrollView, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Totals } from '@/components/totals';
import { BackButton, Text } from '@native/ui';
import { LOGO_XML } from '@native/logo-xml';
import { useRequireAuth } from '@/lib/require-auth';
import { supabase } from '@native/supabase';
import { isActive, LIT, STATUS_COPY, STEPS } from '@core/customer-status';
import { formatRand } from '@core/money';
import { orderCode } from '@core/orders';
import { colors } from '@native/theme';

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { session } = useRequireAuth();
  const { data } = useQuery({
    queryKey: ['order', id],
    enabled: !!session,
    refetchInterval: (q) => (q.state.data && !isActive(q.state.data.order.status) ? false : 10_000),
    queryFn: async () => {
      const { data: order } = await supabase
        .from('orders')
        .select('id, status, food_cents, delivery_fee_cents, tip_cents, payment_method, payment_status, delivery_address, branches(name, restaurants(name))')
        .eq('id', id)
        .maybeSingle();
      if (!order) return null;
      const [{ data: items }, { data: tracking }] = await Promise.all([
        supabase.from('order_items').select('id, name, quantity, unit_price_cents').eq('order_id', order.id),
        supabase.rpc('order_tracking', { oid: order.id }),
      ]);
      return { order, items: items ?? [], driver: tracking?.[0] ?? null };
    },
  });

  if (data === undefined) return <Text color={colors.muted} style={{ padding: 24, paddingTop: insets.top + 24 }}>Loading order</Text>;
  if (data === null) {
    return (
      <View style={{ padding: 24, paddingTop: insets.top + 12, gap: 16 }}>
        <BackButton />
        <Text weight="bold" size={20}>We could not find that order</Text>
      </View>
    );
  }
  const { order, items, driver } = data;
  const copy = STATUS_COPY[order.status];
  const lit = LIT[order.status];
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
      <View style={{ backgroundColor: colors.brand, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, paddingTop: insets.top + 8, paddingHorizontal: 24, paddingBottom: 32, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: -90, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.1)' }} />
        <BackButton onPress={() => router.navigate('/orders')} label="Your orders" />
        <View style={{ alignItems: 'center', marginTop: -36 }}>
          <SvgXml xml={LOGO_XML} width={120} height={80} />
        </View>
        <Text color={colors.onDark} style={{ marginTop: 16 }}>{order.branches?.restaurants?.name ?? 'Restaurant'} · {orderCode(order.id)}</Text>
        <Text weight="extrabold" size={30} color={colors.white} accessibilityLiveRegion="polite">{copy.title}</Text>
        <Text color="rgba(255,255,255,0.85)">{copy.detail}</Text>
      </View>

      <View style={{ paddingHorizontal: 24 }}>
        {copy.step >= 0 && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 24 }} accessibilityLabel="Order progress">
            {STEPS.map((label, i) => (
              <View key={label} style={{ flex: 1 }}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: i < lit ? colors.brand : colors.line }} />
                <Text size={14} weight={i < lit ? 'semibold' : 'regular'} color={i < lit ? colors.ink : colors.muted} style={{ marginTop: 8 }}>{label}</Text>
              </View>
            ))}
          </View>
        )}

        {driver && (
          <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 24, backgroundColor: colors.card }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
              <User size={28} weight="bold" color={colors.muted} />
            </View>
            <View>
              <Text weight="bold" size={18}>{driver.driver_first_name}</Text>
              <Text color={colors.muted}>{driver.vehicle_model} · {driver.vehicle_plate}</Text>
            </View>
          </View>
        )}

        <Text weight="bold" size={17} style={{ marginTop: 24 }}>Order {orderCode(order.id)}</Text>
        <Text color={colors.muted}>{count} {count === 1 ? 'item' : 'items'} · {formatRand(order.food_cents + order.delivery_fee_cents + order.tip_cents)}</Text>

        <View style={{ marginTop: 20, padding: 20, borderRadius: 24, borderWidth: 1.5, borderColor: colors.line }}>
          <View style={{ gap: 8, marginBottom: 16 }}>
            {items.map((i) => (
              <View key={i.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ flex: 1 }}>{i.quantity} × {i.name}</Text>
                <Text weight="medium">{formatRand(i.quantity * i.unit_price_cents)}</Text>
              </View>
            ))}
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 16 }}>
            <Totals food={order.food_cents} deliveryFee={order.delivery_fee_cents} tip={order.tip_cents} />
          </View>
          <Text color={colors.muted} style={{ marginTop: 16 }}>
            {order.payment_method === 'cash' ? 'Pay cash to your driver.' : order.payment_status === 'paid' ? 'Paid by card.' : 'Card payment pending.'}
          </Text>
        </View>
        <Text color={colors.muted} style={{ marginTop: 16 }}>Delivering to {order.delivery_address}</Text>
      </View>
    </ScrollView>
  );
}
