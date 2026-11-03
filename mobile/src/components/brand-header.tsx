import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LOGO_XML } from '@/lib/logo-xml';
import { colors } from '@/theme';

/** The orange rounded header with the HappiGo logo, from the sign in design. */
export function BrandHeader({ topInset }: { topInset: number }) {
  return (
    <View style={{ height: 236 + Math.max(0, topInset - 20), backgroundColor: colors.brand, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden', alignItems: 'center' }}>
      <View style={{ position: 'absolute', top: -90, right: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.08)' }} />
      <View style={{ marginTop: Math.max(22, topInset) }} accessibilityLabel="HappiGo" accessibilityRole="image">
        <SvgXml xml={LOGO_XML} width={292} height={195} />
      </View>
    </View>
  );
}
