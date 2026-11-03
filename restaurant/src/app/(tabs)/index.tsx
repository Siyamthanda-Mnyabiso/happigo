import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatRand } from '@core/money';
import { ageLabel, DEFAULT_PREP, itemCountLabel, minutesToReady, orderCode } from '@core/orders';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';
import { Pill, Text } from '@native/ui';
import { FoodImage } from '@/components/food-image';
import { RespondButtons } from '@/components/order-actions';
import { Toggle } from '@/components/toggle';
import { useOrders, type OrderRow } from '@/lib/data';
import { useNow } from '@/lib/now';
import { usePartner } from '@/lib/partner';

const TABS = [
  { id: 'new', label: 'New', statuses: ['new'] },
  { id: 'preparing', label: 'Preparing', statuses: ['preparing'] },
  { id: 'ready', label: 'Ready', statuses: ['ready'] },
  { id: 'done', label: 'Done', statuses: ['picked_up', 'delivered'] },
] as const;
type TabId = (typeof TABS)[number]['id'];

const EMPTY: Record<TabId, string> = {
  new: 'No new orders. They show up here the moment a customer orders.',
  preparing: 'Nothing in the kitchen right now.',
  ready: 'No orders waiting for a driver.',
  done: 'Nothing finished yet today.',
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14 }}>
      <Text weight="extrabold" size={20}>{value}</Text>
      <Text color={colors.muted}>{label}</Text>
    </View>
  );
}

function OrderCard({ o, now, uid }: { o: OrderRow; now: number; uid: string | undefined }) {
  const qty = o.order_items.reduce((n, i) => n + i.quantity, 0);
  const sub =
    o.status === 'preparing' ? `Ready in ${minutesToReady(o.accepted_at, o.prep_minutes, now)} min` :
    o.status === 'ready' ? 'Waiting for driver' :
    o.status === 'new' ? ageLabel(o.created_at, now) : o.status === 'delivered' ? 'Delivered' : 'On the way';
  return (
    <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 24, padding: 16, marginBottom: 12 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open order ${orderCode(o.id)}`} onPress={() => router.push({ pathname: '/order/[id]', params: { id: o.id } })}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text weight="bold">{orderCode(o.id)}</Text>
          <Text color={colors.muted}>{sub}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Text weight="semibold">{o.customer_name ?? 'Customer'}</Text>
          <Text weight="semibold">{`${itemCountLabel(qty)} · ${formatRand(o.food_cents)}`}</Text>
        </View>
        <View style={{ marginVertical: 10 }}>
          {o.order_items.map((i, idx) => <Text key={idx} color={colors.muted}>{`${i.quantity}x ${i.name}`}</Text>)}
        </View>
      </Pressable>
      {o.status === 'new' && <RespondButtons orderId={o.id} prep={DEFAULT_PREP} uid={uid} />}
    </View>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { uid, partner, ready } = usePartner({ onboarded: true });
  const orders = useOrders(uid);
  const now = useNow(30_000);
  const [tab, setTab] = useState<TabId>('new');
  const [toggling, setToggling] = useState(false);

  const all = useMemo(() => orders.data ?? [], [orders.data]);
  const today = useMemo(() => {
    const live = all.filter((o) => o.status !== 'declined' && o.status !== 'cancelled');
    const sales = live.reduce((n, o) => n + o.food_cents, 0);
    return { count: live.length, sales, avg: live.length ? Math.round(sales / live.length) : 0 };
  }, [all]);

  if (!ready || !partner) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></View>;

  const statuses = TABS.find((t) => t.id === tab)!.statuses as readonly string[];
  const shown = all.filter((o) => statuses.includes(o.status));
  const accepting = partner.branch?.accepting_orders ?? false;

  async function setAccepting(v: boolean) {
    if (!partner?.branch) return router.push('/store-details');
    setToggling(true);
    await supabase.from('branches').update({ accepting_orders: v }).eq('id', partner.branch.id);
    await qc.invalidateQueries({ queryKey: ['partner', uid] });
    setToggling(false);
  }

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: 130 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.card }}>
          <FoodImage uri={partner.restaurant.image_url} hint={partner.restaurant.cuisine} seed={partner.restaurant.id} emojiSize={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="bold" size={18}>{partner.restaurant.name}</Text>
          <Text color={accepting ? colors.ok : colors.muted}>{accepting ? 'Open now' : 'Closed to orders'}</Text>
        </View>
        <Toggle value={accepting} onChange={setAccepting} label="Accepting orders" disabled={toggling} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <Stat value={String(today.count)} label="Orders" />
        <Stat value={formatRand(today.sales)} label="Sales" />
        <Stat value={formatRand(today.avg)} label="Avg order" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
        {TABS.map((t) => {
          const n = t.id === 'done' ? 0 : all.filter((o) => (t.statuses as readonly string[]).includes(o.status)).length;
          return <Pill key={t.id} label={n ? `${t.label} ${n}` : t.label} active={t.id === tab} onPress={() => setTab(t.id)} />;
        })}
      </ScrollView>
      {orders.isLoading ? <ActivityIndicator color={colors.brand} /> : !shown.length ? (
        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 20 }}><Text color={colors.muted}>{EMPTY[tab]}</Text></View>
      ) : (
        shown.map((o) => <OrderCard key={o.id} o={o} now={now} uid={uid} />)
      )}
    </ScrollView>
  );
}
