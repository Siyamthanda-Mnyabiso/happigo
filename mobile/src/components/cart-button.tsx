import { router } from 'expo-router';
import { Handbag } from 'phosphor-react-native';
import { Pressable, View } from 'react-native';
import { useCart } from '@/lib/cart';
import { colors } from '@native/theme';
import { Text } from '@native/ui';

export function CartButton() {
  const { count } = useCart();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count ? `Cart, ${count} items` : 'Cart'}
      onPress={() => router.push('/cart')}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}
    >
      <Handbag size={22} weight="bold" color={colors.ink} />
      {count > 0 && (
        <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.brand, borderWidth: 2, borderColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <Text weight="bold" size={12} color={colors.white} style={{ lineHeight: 14 }}>
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
