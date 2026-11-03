import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Minus, Plus } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FoodImage } from '@/components/food-image';
import { BackButton, Button, Text } from '@/components/ui';
import { useCart } from '@/lib/cart';
import { supabase } from '@/lib/supabase';
import { formatRand } from '@core/money';
import { colors } from '@/theme';

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const { data: item } = await supabase
        .from('menu_items')
        .select('id, branch_id, name, description, price_cents, category, image_url')
        .eq('id', id)
        .eq('available', true)
        .maybeSingle();
      if (!item) return null;
      const { data: branch } = await supabase.from('branches').select('id, restaurant_id, accepting_orders').eq('id', item.branch_id).maybeSingle();
      if (!branch) return null;
      const { data: restaurant } = await supabase.from('restaurants').select('id, name').eq('id', branch.restaurant_id).maybeSingle();
      return restaurant ? { item, branch, restaurant } : null;
    },
  });

  if (isLoading) return <Text color={colors.muted} style={{ padding: 24, paddingTop: insets.top + 24 }}>Loading</Text>;
  if (!data) {
    return (
      <View style={{ padding: 24, paddingTop: insets.top + 12, gap: 16 }}>
        <BackButton />
        <Text weight="bold" size={20}>This item is not available</Text>
      </View>
    );
  }
  const { item, branch, restaurant } = data;
  const step = { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' } as const;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={{ height: 300, backgroundColor: colors.card }}>
          <FoodImage uri={item.image_url} hint={`${item.category} ${item.name}`} seed={item.name} emojiSize={120} />
          <View style={{ position: 'absolute', left: 24, top: insets.top + 8 }}>
            <BackButton label={`Back to ${restaurant.name}`} />
          </View>
        </View>
        <View style={{ marginTop: -32, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: colors.white, paddingHorizontal: 24, paddingTop: 28 }}>
          <Text weight="extrabold" size={28} accessibilityRole="header">{item.name}</Text>
          <Text weight="bold" size={20} color={colors.brand} style={{ marginTop: 4 }}>{formatRand(item.price_cents)}</Text>
          {item.description ? <Text color={colors.muted} style={{ marginTop: 12 }}>{item.description}</Text> : null}
          <Text color={colors.muted} style={{ marginTop: 24 }}>From {restaurant.name}</Text>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line }}>
        <View style={{ height: 56, borderRadius: 28, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="One less" onPress={() => setQty((q) => Math.max(1, q - 1))} style={step}>
            <Minus size={20} weight="bold" color={colors.ink} />
          </Pressable>
          <Text weight="bold" size={18} style={{ width: 32, textAlign: 'center' }} accessibilityLiveRegion="polite">{qty}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="One more" onPress={() => setQty((q) => Math.min(20, q + 1))} style={step}>
            <Plus size={20} weight="bold" color={colors.ink} />
          </Pressable>
        </View>
        <Button
          style={{ flex: 1 }}
          disabled={!branch.accepting_orders}
          label={branch.accepting_orders ? `Add to cart · ${formatRand(item.price_cents * qty)}` : 'Not taking orders'}
          onPress={() => {
            add(branch.id, item.id, qty);
            router.back();
          }}
        />
      </View>
    </View>
  );
}
