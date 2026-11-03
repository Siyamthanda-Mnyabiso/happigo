import { router, useLocalSearchParams } from 'expo-router';
import { Plus } from 'phosphor-react-native';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FoodImage } from '@/components/food-image';
import { BackButton, Pill, Text } from '@/components/ui';
import { useCart } from '@/lib/cart';
import { useRestaurantMenu } from '@/lib/data';
import { formatRand } from '@core/money';
import { qtyOf } from '@core/cart';
import { colors, shadow } from '@/theme';

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useRestaurantMenu(id);
  const { cart, add } = useCart();
  const scroll = useRef<ScrollViewInstance>(null);
  const offsets = useRef<Record<string, number>>({});
  const wrapperY = useRef(0);
  const [active, setActive] = useState(0);

  if (isLoading) return <Text color={colors.muted} style={{ padding: 24, paddingTop: insets.top + 24 }}>Loading menu</Text>;
  if (!data) {
    return (
      <View style={{ padding: 24, paddingTop: insets.top + 12, gap: 16 }}>
        <BackButton />
        <Text weight="bold" size={20}>This restaurant is not available</Text>
      </View>
    );
  }
  const { restaurant, branch, items } = data;
  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.popular ? 'Popular' : item.category;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const sections = [...groups.entries()].sort(([a], [b]) => Number(b === 'Popular') - Number(a === 'Popular'));

  const inThisCart = cart.branchId === branch.id;
  const cartCount = inThisCart ? cart.lines.reduce((n, l) => n + l.qty, 0) : 0;
  const cartTotal = inThisCart
    ? cart.lines.reduce((sum, l) => sum + (items.find((i) => i.id === l.id)?.price_cents ?? 0) * l.qty, 0)
    : 0;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView ref={scroll} stickyHeaderIndices={sections.length > 1 ? [2] : undefined} contentContainerStyle={{ paddingBottom: cartCount ? 120 : 48 }} showsVerticalScrollIndicator={false}>
        <View style={{ height: 240, backgroundColor: colors.card }}>
          <FoodImage uri={restaurant.image_url} hint={restaurant.cuisine ?? restaurant.name} seed={restaurant.name} emojiSize={110} />
          <View style={{ position: 'absolute', left: 24, top: insets.top + 8 }}>
            <BackButton label="Back to restaurants" />
          </View>
        </View>

        <View style={{ marginTop: -32, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: colors.white, paddingHorizontal: 24, paddingTop: 24 }}>
          <Text weight="extrabold" size={28} accessibilityRole="header">{restaurant.name}</Text>
          <Text color={colors.muted}>{[restaurant.cuisine, `${formatRand(restaurant.delivery_fee_cents)} delivery`, 'No service fee'].filter(Boolean).join(' · ')}</Text>
          {!branch.accepting_orders && (
            <View accessibilityRole="alert" style={{ marginTop: 16, padding: 20, borderRadius: 22, backgroundColor: colors.card }}>
              <Text weight="bold">Not taking orders right now</Text>
              <Text color={colors.muted}>You can look at the menu. Come back soon to order.</Text>
            </View>
          )}
        </View>

        {sections.length > 1 ? (
          <View style={{ backgroundColor: colors.white, paddingVertical: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
              {sections.map(([category], i) => (
                <Pill
                  key={category}
                  label={category}
                  active={i === active}
                  onPress={() => {
                    setActive(i);
                    scroll.current?.scrollTo({ y: offsets.current[category] ?? 0, animated: true });
                  }}
                />
              ))}
            </ScrollView>
          </View>
        ) : (
          <View />
        )}

        <View onLayout={(e) => (wrapperY.current = e.nativeEvent.layout.y)} style={{ paddingHorizontal: 24, backgroundColor: colors.white }}>
          {sections.length === 0 && <Text color={colors.muted} style={{ marginTop: 16 }}>This menu is empty at the moment.</Text>}
          {sections.map(([category, list]) => (
            <View key={category} onLayout={(e) => (offsets.current[category] = wrapperY.current + e.nativeEvent.layout.y - 68)} style={{ marginTop: 8 }}>
              <Text weight="extrabold" size={20} accessibilityRole="header" style={{ marginBottom: 12 }}>{category}</Text>
              <View style={{ gap: 20 }}>
                {list.map((item) => {
                  const inCart = qtyOf(cart, item.id);
                  return (
                    <View key={item.id} style={{ flexDirection: 'row', gap: 16 }}>
                      <Pressable accessibilityRole="button" onPress={() => router.push(`/item/${item.id}`)} style={{ flex: 1 }}>
                        <Text weight="bold" size={17}>{item.name}</Text>
                        {item.description ? <Text color={colors.muted} numberOfLines={2}>{item.description}</Text> : null}
                        <Text weight="bold" size={17} style={{ marginTop: 4 }}>{formatRand(item.price_cents)}</Text>
                      </Pressable>
                      <View style={{ width: 100, height: 90 }}>
                        <Pressable accessibilityRole="button" accessibilityLabel={`${item.name} details`} onPress={() => router.push(`/item/${item.id}`)} style={{ flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.card }}>
                          <FoodImage uri={item.image_url} hint={`${item.category} ${item.name}`} seed={item.name} emojiSize={34} />
                        </Pressable>
                        {branch.accepting_orders && (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Add ${item.name}${inCart ? `, ${inCart} in cart` : ''}`}
                            onPress={() => add(branch.id, item.id)}
                            style={[{ position: 'absolute', right: -8, bottom: -8, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brand, borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' }, shadow.soft]}
                          >
                            {inCart ? <Text weight="bold" color={colors.white}>{inCart}</Text> : <Plus size={20} weight="bold" color={colors.white} />}
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {cartCount > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View cart, ${cartCount} items, ${formatRand(cartTotal)}`}
          onPress={() => router.push('/cart')}
          style={[{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 16), height: 64, borderRadius: 32, backgroundColor: colors.brand, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 }, shadow.brand]}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
            <Text weight="bold" size={18} color={colors.white}>{cartCount}</Text>
          </View>
          <Text weight="semibold" size={18} color={colors.white} style={{ flex: 1 }}>View cart</Text>
          <Text weight="bold" size={18} color={colors.white} style={{ paddingRight: 8 }}>{formatRand(cartTotal)}</Text>
        </Pressable>
      )}
    </View>
  );
}
