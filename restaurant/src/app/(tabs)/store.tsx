import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { CaretRight, MapPin, SignOut } from 'phosphor-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PLANS } from '@core/plans';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';
import { Text } from '@native/ui';
import { FoodImage } from '@/components/food-image';
import { Toggle } from '@/components/toggle';
import { usePartner } from '@/lib/partner';

function Row({ label, value, onPress }: { label: string; value?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, borderBottomWidth: 1, borderBottomColor: colors.line }}>
      <Text weight="medium">{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {value ? <Text color={colors.muted}>{value}</Text> : null}
        <CaretRight size={18} color={colors.muted} />
      </View>
    </Pressable>
  );
}

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { uid, partner, ready } = usePartner({ onboarded: true });
  const [toggling, setToggling] = useState(false);
  const bank = useQuery({
    queryKey: ['bank', partner?.restaurant.id],
    enabled: !!partner,
    queryFn: async () => (await supabase.from('bank_accounts').select('bank, account_last4').eq('restaurant_id', partner!.restaurant.id).maybeSingle()).data,
  });

  if (!ready || !partner) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></View>;
  const { restaurant, branch } = partner;

  async function setAccepting(v: boolean) {
    if (!branch) return router.push('/store-details');
    setToggling(true);
    await supabase.from('branches').update({ accepting_orders: v }).eq('id', branch.id);
    await qc.invalidateQueries({ queryKey: ['partner', uid] });
    setToggling(false);
  }

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 130 }}>
      <Text weight="extrabold" size={30} accessibilityRole="header" style={{ marginBottom: 16 }}>Store</Text>
      <View style={{ height: 120, borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}><FoodImage uri={restaurant.image_url} hint={restaurant.cuisine} seed={restaurant.id} /></View>
      <Text weight="extrabold" size={24}>{restaurant.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}><MapPin size={18} color={colors.muted} /><Text color={colors.muted}>{branch?.address ?? 'Add your address'}</Text></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 16 }}>
        <View style={{ flex: 1 }}><Text weight="bold">Accepting orders</Text><Text color={colors.muted}>Customers can order right now</Text></View>
        <Toggle value={branch?.accepting_orders ?? false} onChange={setAccepting} label="Accepting orders" disabled={toggling} />
      </View>
      <Row label="Store details" onPress={() => router.push('/store-details')} />
      <Row label="Subscription" value={restaurant.plan ? PLANS[restaurant.plan].name.split(' ')[0] : undefined} onPress={() => router.push('/subscription')} />
      <Row label="Payouts and bank" value={bank.data ? `${bank.data.bank} ${bank.data.account_last4}` : undefined} onPress={() => router.push('/payouts')} />
      <Pressable accessibilityRole="button" onPress={async () => { await supabase.auth.signOut(); router.replace('/sign-in'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' }}><SignOut size={20} color={colors.brand} /></View>
        <Text weight="semibold" color={colors.brand}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}
