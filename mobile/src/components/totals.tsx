import { View } from 'react-native';
import { formatRand } from '@core/money';
import { colors } from '@native/theme';
import { Text } from '@native/ui';

/** Food, delivery, tip, total. Same breakdown in the cart, at checkout and on the receipt. */
export function Totals({ food, deliveryFee, tip = 0, showTotal = true }: { food: number; deliveryFee: number; tip?: number; showTotal?: boolean }) {
  const rows: [string, number][] = [['Food', food], ['Delivery fee', deliveryFee], ...(tip ? ([['Tip for your driver', tip]] as [string, number][]) : [])];
  return (
    <View style={{ gap: 12 }}>
      {rows.map(([label, cents]) => (
        <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text color={colors.muted}>{label}</Text>
          <Text weight="medium">{formatRand(cents)}</Text>
        </View>
      ))}
      {showTotal && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 16 }}>
          <Text weight="bold" size={20}>Total</Text>
          <Text weight="bold" size={20}>{formatRand(food + deliveryFee + tip)}</Text>
        </View>
      )}
    </View>
  );
}
