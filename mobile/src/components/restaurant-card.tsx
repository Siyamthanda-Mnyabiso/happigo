import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { formatRand } from '@core/money';
import type { RestaurantSummary } from '@/lib/data';
import { colors } from '@native/theme';
import { FoodImage } from './food-image';
import { Text } from '@native/ui';

/** Photo card from the design. `wide` is the full width version used in search results. */
export function RestaurantCard({ r, width, height }: { r: RestaurantSummary; width?: number; height: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${r.name}, ${r.cuisine ?? 'restaurant'}, ${formatRand(r.delivery_fee_cents)} delivery`}
      onPress={() => router.push(`/restaurant/${r.id}`)}
      style={{ width: width ?? '100%' }}
    >
      <View style={{ height, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.card }}>
        <FoodImage uri={r.image_url} hint={r.cuisine ?? r.name} seed={r.name} emojiSize={64} />
      </View>
      <Text weight="bold" size={17} style={{ marginTop: 12 }}>
        {r.name}
      </Text>
      <Text color={colors.muted}>{[r.cuisine, `${formatRand(r.delivery_fee_cents)} delivery`].filter(Boolean).join(' · ')}</Text>
    </Pressable>
  );
}
