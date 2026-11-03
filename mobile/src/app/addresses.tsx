import { MapPin } from 'phosphor-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '@/components/page-header';
import { Text } from '@native/ui';
import { useAddresses } from '@/lib/account';
import { useRequireAuth } from '@/lib/require-auth';
import { colors } from '@native/theme';

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  useRequireAuth();
  const { data } = useAddresses();
  return (
    <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 24 }}>
      <PageHeader title="Saved addresses" />
      {data?.length ? (
        <View style={{ marginTop: 24 }}>
          {data.map((a) => (
            <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={20} weight="bold" color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text weight="semibold">{a.label}</Text>
                <Text color={colors.muted}>{a.address}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text color={colors.muted} style={{ marginTop: 24, padding: 20, borderRadius: 22, backgroundColor: colors.card }}>
          Addresses you deliver to are saved here after your first order.
        </Text>
      )}
    </View>
  );
}
