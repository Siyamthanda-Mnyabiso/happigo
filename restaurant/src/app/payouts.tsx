import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { CreditCard } from 'phosphor-react-native';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { periodStart } from '@core/delivery';
import { formatRand } from '@core/money';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';
import { Text } from '@native/ui';
import { ScreenHeader } from '@/components/screen-header';
import { usePayouts } from '@/lib/data';
import { useNow } from '@/lib/now';
import { usePartner } from '@/lib/partner';

const day = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' });

export default function PayoutsScreen() {
  const { partner, ready } = usePartner();
  const now = useNow();
  const rid = partner?.restaurant.id;
  const payouts = usePayouts(rid, 50);
  const bank = useQuery({
    queryKey: ['bank', rid],
    enabled: !!rid,
    queryFn: async () => (await supabase.from('bank_accounts').select('bank, account_last4').eq('restaurant_id', rid!).maybeSingle()).data,
  });
  if (!ready || payouts.isLoading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></View>;
  const monthStart = periodStart('month', now).getTime();
  const month = (payouts.data ?? []).filter((p) => new Date(p.paid_on).getTime() >= monthStart).reduce((n, p) => n + p.amount_cents, 0);
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Payouts" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        <View style={{ backgroundColor: colors.ink, borderRadius: 24, padding: 24, marginBottom: 16 }}>
          <Text color={colors.onDark}>Paid out this month</Text>
          <Text weight="extrabold" size={36} color={colors.white}>{formatRand(month)}</Text>
          <Text color={colors.onDark}>No commission taken</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 20, padding: 14, marginBottom: 24 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}><CreditCard size={20} color={colors.brand} /></View>
          <View style={{ flex: 1 }}>
            <Text weight="bold">{bank.data ? `${bank.data.bank} ending ${bank.data.account_last4}` : 'No bank connected'}</Text>
            <Text color={colors.muted}>Paid straight to this account</Text>
          </View>
          <Text weight="semibold" color={colors.brand} accessibilityRole="link" onPress={() => router.push('/onboarding/bank')}>Change</Text>
        </View>
        <Text weight="bold" size={18} style={{ marginBottom: 8 }}>Payout history</Text>
        {!payouts.data?.length ? <Text color={colors.muted}>No payouts yet.</Text> : payouts.data.map((p) => (
          <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <View><Text weight="medium">{day.format(new Date(p.paid_on))}</Text><Text color={colors.muted}>{bank.data ? `Sent to ${bank.data.bank} ending ${bank.data.account_last4}` : 'Sent to your bank'}</Text></View>
            <View style={{ alignItems: 'flex-end' }}><Text weight="bold">{formatRand(p.amount_cents)}</Text><Text color={colors.muted} style={{ textTransform: 'capitalize' }}>{p.status}</Text></View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
