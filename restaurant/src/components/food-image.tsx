import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { categoryPhoto, emojiFor, tintIndex } from '@core/food';
import { Text } from '@native/ui';

/** The five photos from the design. Keys match what categoryPhoto() returns. */
const BUNDLED = {
  '/food/burgers.jpg': require('../../assets/food/burgers.jpg'),
  '/food/pizza.jpg': require('../../assets/food/pizza.jpg'),
  '/food/sushi.jpg': require('../../assets/food/sushi.jpg'),
  '/food/healthy.jpg': require('../../assets/food/healthy.jpg'),
  '/food/curry.jpg': require('../../assets/food/curry.jpg'),
} as const;

export const PROMO_BANNER = require('../../assets/food/promo-banner.jpg');
export const photoSource = (path: keyof typeof BUNDLED) => BUNDLED[path];

// The same four warm tints the web app uses, in the same order.
const TINTS = ['#ffd2b8', '#ffdc9c', '#ffbcbc', '#fbc598'];

/**
 * A food photo that fills its parent. Preference order: the restaurant's own photo, then the matching
 * photo from the design, then a tinted tile with an emoji.
 */
export function FoodImage({
  uri,
  hint,
  seed,
  emojiSize = 40,
}: {
  uri: string | null;
  hint: string | null;
  seed: string;
  emojiSize?: number;
}) {
  const bundled = categoryPhoto(hint) as keyof typeof BUNDLED | null;
  const source = uri ? { uri } : bundled ? BUNDLED[bundled] : null;
  if (source) return <Image source={source} contentFit="cover" transition={150} style={StyleSheet.absoluteFill} accessibilityElementsHidden />;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: TINTS[tintIndex(seed)], alignItems: 'center', justifyContent: 'center' }]}>
      <Text size={emojiSize}>{emojiFor(hint)}</Text>
    </View>
  );
}
