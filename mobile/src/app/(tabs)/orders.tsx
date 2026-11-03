import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FoodImage } from '@/components/food-image';
import { Pill, Text } from '@native/ui';
import { useRequireAuth } from '@/lib/require-auth';
import { supabase } from '@native/supabase';
import { isActive, STATUS_COPY } from '@core/customer-status';
import { formatRand } from '@core/money';
import { colors, shadow } from '@native/theme';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useRequireAuth();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const past = tab === 'past';
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders', session?.user.id],
    enabled: !!session,
    // Orders move through stages while the screen is open, so check every 15 seconds.
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, total_cents, tip_cents, created_at, delivered_at, branches(restaurants(name, cuisine, image_url)), order_items(quantity)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
  const shown = (data ?? []).filter((o) => isActive(o.status) === !past);

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 12 }}>
      <Text weight="extrabold" size={28} accessibilityRole="header" style={{ paddingHorizontal: 24 }}>My orders</Text>
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginTop: 16, marginBottom: 16 }}>
        <Pill label="Active" active={!past} onPress={() => router.setParams({ tab: undefined })} />
        <Pill label="Past" active={past} onPress={() => router.setParams({ tab: 'past' })} />
      </View>
      <FlatList
        data={shown}
        keyExtractor={(o) => o.id}
        refreshing={isRefetching}
        onRefresh={refetch}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 130, gap: 16 }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={{ padding: 24, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', gap: 4 }}>
              <Text weight="bold">{past ? 'No past orders yet' : 'No orders in progress'}</Text>
              <Text color={colors.muted}>Hungry? Find something to eat.</Text>
              <Pressable accessibilityRole="link" onPress={() => router.navigate('/')}>
                <Text weight="semibold" color={colors.brand}>Browse restaurants</Text>
              </Pressable>
            </View>
          
          ) : undefined
        }
        renderItem={({ item: o }) => {
          const r = o.branches?.restaurants;
          const items = o.order_items.reduce((n, i) => n + i.quantity, 0);
          const active = isActive(o.status);
          const day = new Date(o.delivered_at ?? o.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
          return (
            <View style={{ padding: 16, borderRadius: 24, borderWidth: 1.5, borderColor: colors.line }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ width: 68, height: 68, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.card }}>
                  <FoodImage uri={r?.image_url ?? null} hint={r?.cuisine ?? r?.name ?? null} seed={r?.name ?? o.id} emojiSize={28} />
                </View>
                <View style={{ flex: 1, alignItems: 'flex-start' }}>
                  <Text weight="bold" size={17}>{r?.name ?? 'Restaurant'}</Text>
                  <Text color={colors.muted}>{items} {items === 1 ? 'item' : 'items'} · {formatRand((o.total_cents ?? 0) + o.tip_cents)}</Text>
                  {active ? (
                    <View style={{ marginTop: 4, paddingHorizontal: 12, paddingVertical: 2, borderRadius: 12, backgroundColor: colors.okBg }}>
                      <Text weight="medium" color={colors.ok}>{STATUS_COPY[o.status].short}</Text>
                    </View>
                  ) : (
                    <Text color={colors.muted}>{STATUS_COPY[o.status].short} {o.status === 'delivered' ? day : ''}</Text>
                  )}
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/order/${o.id}`)}
                style={[{ marginTop: 16, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, active ? [{ backgroundColor: colors.brand }, shadow.brand] : { borderWidth: 1.5, borderColor: colors.line }]}
              >
                <Text weight="semibold" color={active ? colors.white : colors.ink}>{active ? 'Track order' : 'View order'}</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}
