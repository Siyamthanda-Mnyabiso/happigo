import { router } from 'expo-router';
import { Minus, Plus } from 'phosphor-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FoodImage } from '@/components/food-image';
import { PageHeader } from '@/components/page-header';
import { Totals } from '@/components/totals';
import { Button, Text } from '@native/ui';
import { useCart } from '@/lib/cart';
import { useCartView } from '@/lib/data';
import { formatRand } from '@core/money';
import { colors } from '@native/theme';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { cart, setQuantity, clear } = useCart();
  const { data: view, isLoading } = useCartView(cart);

  if (!cart.lines.length || (!isLoading && !view)) {
    return (
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 24 }}>
        <PageHeader title="Your cart" />
        <View style={{ marginTop: 32, padding: 24, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', gap: 12 }}>
          <Text weight="bold" size={18}>Your cart is empty</Text>
          <Text color={colors.muted}>Pick a restaurant and add something tasty.</Text>
          <Button label="Browse restaurants" onPress={() => router.replace('/')} style={{ alignSelf: 'stretch' }} />
        </View>
      </View>
    );
  }
  if (!view) return <Text color={colors.muted} style={{ padding: 24, paddingTop: insets.top + 24 }}>Loading cart</Text>;
  const { restaurant, lines, totals } = view;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: 140 }}>
        <PageHeader title="Your cart" />
        <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.card }}>
            <FoodImage uri={restaurant.image_url} hint={restaurant.cuisine ?? restaurant.name} seed={restaurant.name} emojiSize={16} />
          </View>
          <Text weight="semibold" style={{ flex: 1 }}>{restaurant.name}</Text>
          <Pressable accessibilityRole="link" onPress={() => router.push(`/restaurant/${restaurant.id}`)}>
            <Text weight="semibold" color={colors.brand}>Add more</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 16 }}>
          {lines.map(({ item, qty }, i) => (
            <View key={item.id} style={{ flexDirection: 'row', gap: 16, paddingVertical: 16, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
              <View style={{ width: 84, height: 84, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.card }}>
                <FoodImage uri={item.image_url} hint={`${item.category} ${item.name}`} seed={item.name} emojiSize={30} />
              </View>
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                <Text weight="semibold" size={17}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <Text weight="bold" size={17}>{formatRand(item.price_cents * qty)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 20, padding: 4 }}>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Remove one ${item.name}`} onPress={() => setQuantity(item.id, qty - 1)} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                      <Minus size={16} weight="bold" color={colors.ink} />
                    </Pressable>
                    <Text weight="semibold" style={{ width: 28, textAlign: 'center' }} accessibilityLabel={`${qty} in cart`}>{qty}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Add one ${item.name}`} onPress={() => setQuantity(item.id, qty + 1)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={16} weight="bold" color={colors.white} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 20 }}>
          <Totals food={totals.food} deliveryFee={totals.deliveryFee} />
        </View>
        <Text color={colors.muted} style={{ marginTop: 20 }}>No service fee. Your payment goes straight to {restaurant.name}.</Text>
        <Pressable accessibilityRole="button" onPress={clear} style={{ marginTop: 16 }}>
          <Text weight="semibold" color={colors.muted} style={{ textDecorationLine: 'underline' }}>Empty cart</Text>
        </Pressable>
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.white }}>
        <Button label="Go to checkout" onPress={() => router.push('/checkout')} />
      </View>
    </View>
  );
}
