import { Image } from 'expo-image';
import { Camera } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { colors } from '@native/theme';
import { Text } from '@native/ui';
import { pickPhoto, type Picked } from '@/lib/photo';

/** The photo box with a "Change photo" pill, from the edit screens. */
export function PhotoField({ currentUrl, onPick, height = 170 }: { currentUrl: string | null; onPick: (p: Picked) => void; height?: number }) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [error, setError] = useState<string | null>(null);

  async function choose() {
    setError(null);
    const r = await pickPhoto();
    if (!r) return;
    if ('error' in r) return setError(r.error);
    setPreview(r.uri);
    onPick(r);
  }

  return (
    <View style={{ marginBottom: 16 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={preview ? 'Change photo' : 'Add a photo'}
        onPress={choose}
        style={{ height, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.card, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12 }}
      >
        {preview ? <Image source={{ uri: preview }} contentFit="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.white }}>
          <Camera size={18} color={colors.ink} />
          <Text weight="semibold">{preview ? 'Change photo' : 'Add a photo'}</Text>
        </View>
      </Pressable>
      {error ? <Text accessibilityRole="alert" color={colors.danger} style={{ marginTop: 6 }}>{error}</Text> : null}
    </View>
  );
}
