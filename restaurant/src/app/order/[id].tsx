import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Clock } from 'phosphor-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatRand } from '@core/money';
import { DEFAULT_PREP, formatCountdown, orderCode, PREP_OPTIONS, secondsLeft } from '@core/orders';
import { calcOrderTotals } from '@core/pricing';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';
import { Pill, Text } from '@native/ui';
import { ReadyButton, RespondButtons } from '@/components/order-actions';
import { ScreenHeader } from '@/components/screen-header';
import { useNow } from '@/lib/now';
import { usePartner } from '@/lib/partner';

function Ring({ left, total }: { left: number; total: number }) {
  const size = 220;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = total > 0 ? Math.min(1, Math.max(0, left / total)) : 0;
  return (
    <View style={{ width: size, height: size, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.peach} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.brand} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${c * done} ${c}`} />
      </Svg>
      <Text weight="extrabold" size={44} accessibilityLabel={`${Math.ceil(left / 60)} minutes left to prepare`}>{formatCountdown(left)}</Text>
      <Text color={colors.muted}>left to prepare</Text>
    </View>
  );
}

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { uid, ready } = usePartner();
  const now = useNow(1000);
  const [prep, setPrep] = useState<number>(DEFAULT_PREP);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const q = useQuery({
    queryKey: ['order', id],
    enabled: ready,
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, food_cents, delivery_fee_cents, customer_name, delivery_address, note, respond_by, prep_minutes, accepted_at, order_items(id, name, options, quantity, unit_price_cents)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!ready || q.isLoading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></View>;
  const o = q.data;
  if (!o) return <View style={{ flex: 1 }}><ScreenHeader title="Order" /><Text style={{ padding: 24 }} color={colors.muted}>Order not found.</Text></View>;

  const totals = calcOrderTotals({ food: o.food_cents, deliveryFee: o.delivery_fee_cents });
  const back = () => router.replace('/');
  const refreshed = () => { qc.invalidateQueries({ queryKey: ['order', id] }); };

  const bottom = (node: React.ReactNode) => (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24, paddingBottom: Math.max(insets.bottom, 24), backgroundColor: colors.white }}>{node}</View>
  );

  if (o.status === 'preparing') {
    const total = (o.prep_minutes ?? DEFAULT_PREP) * 60;
    const left = o.accepted_at ? Math.max(0, Math.round((new Date(o.accepted_at).getTime() + total * 1000 - now) / 1000)) : total;
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title={`Order ${orderCode(o.id)}`} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}>
          <Ring left={left} total={total} />
          <Text weight="semibold" style={{ textAlign: 'center', marginTop: 8, marginBottom: 20 }}>Preparing</Text>
          <Text weight="bold" size={18} style={{ marginBottom: 8 }}>Items</Text>
          {o.order_items.map((i) => (
            <Pressable key={i.id} accessibilityRole="checkbox" accessibilityState={{ checked: !!checked[i.id] }} onPress={() => setChecked((c) => ({ ...c, [i.id]: !c[i.id] }))} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: checked[i.id] ? colors.ink : colors.white, borderWidth: 1.5, borderColor: checked[i.id] ? colors.ink : colors.line, alignItems: 'center', justifyContent: 'center' }}>
                {checked[i.id] && <Check size={16} weight="bold" color={colors.white} />}
              </View>
              <Text style={{ flex: 1 }}>{`${i.quantity}x ${i.name}${i.options ? ` · ${i.options}` : ''}`}</Text>
            </Pressable>
          ))}
          {o.note ? <Text color={colors.muted} style={{ marginTop: 8 }}>{`Special note: ${o.note}`}</Text> : null}
        </ScrollView>
        {bottom(<ReadyButton orderId={o.id} uid={uid} onDone={back} />)}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title={`Order ${orderCode(o.id)}`} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 160 }}>
        {o.status === 'new' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: 18, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Clock size={24} weight="bold" color={colors.ink} /><Text>Respond within</Text></View>
            <Text weight="extrabold" size={20} color={colors.brand}>{formatCountdown(secondsLeft(o.respond_by, now))}</Text>
          </View>
        )}
        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 24 }}>
          <Text weight="bold">{o.customer_name ?? 'Customer'}</Text>
          <Text color={colors.muted}>{o.delivery_address}</Text>
        </View>
        <Text weight="bold" size={18} style={{ marginBottom: 12 }}>Items</Text>
        {o.order_items.map((i) => (
          <View key={i.id} style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}><Text weight="bold">{`${i.quantity}x`}</Text></View>
            <View style={{ flex: 1 }}>
              <Text weight="semibold">{i.name}</Text>
              {i.options ? <Text color={colors.muted}>{i.options}</Text> : null}
            </View>
            <Text weight="semibold">{formatRand(i.unit_price_cents * i.quantity)}</Text>
          </View>
        ))}
        {o.note ? <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14, marginBottom: 16 }}><Text accessibilityLabel={`Customer note: ${o.note}`}>{o.note}</Text></View> : null}
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 8, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}><Text color={colors.muted}>Subtotal</Text><Text weight="semibold">{formatRand(totals.food)}</Text></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}><Text color={colors.muted}>HappiGo commission</Text><Text weight="semibold">{formatRand(totals.commission)}</Text></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 6 }}><Text weight="bold" size={18}>Paid to your account</Text><Text weight="extrabold" size={20} color={colors.brand}>{formatRand(totals.restaurantPayout)}</Text></View>
        </View>
        {o.status === 'new' && (
          <>
            <Text weight="bold" size={18} style={{ marginBottom: 8 }}>Prep time</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {PREP_OPTIONS.map((m) => <Pill key={m} label={`${m} min`} active={prep === m} onPress={() => setPrep(m)} />)}
            </View>
          </>
        )}
        {o.status === 'ready' && <Text color={colors.muted}>Ready. Waiting for the driver to collect it.</Text>}
        {(o.status === 'picked_up' || o.status === 'delivered') && <Text color={colors.muted}>{o.status === 'delivered' ? 'Delivered to the customer.' : 'Collected by the driver.'}</Text>}
      </ScrollView>
      {o.status === 'new' && bottom(<RespondButtons orderId={o.id} prep={prep} uid={uid} onDone={(accepted) => { if (accepted) refreshed(); else back(); }} />)}
    </View>
  );
}
