import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PLANS } from '@core/plans';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';
import { Button, Text } from '@native/ui';
import { ScreenHeader } from '@/components/screen-header';
import { usePartner } from '@/lib/partner';

const fmt = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { partner, ready } = usePartner();
  const rid = partner?.restaurant.id;
  const q = useQuery({
    queryKey: ['subscription', rid],
    enabled: !!rid,
    queryFn: async () => {
      const [sub, pays] = await Promise.all([
        supabase.from('subscriptions').select('plan, next_billing_on').eq('restaurant_id', rid!).maybeSingle(),
        supabase.from('subscription_payments').select('id, paid_on, status').eq('restaurant_id', rid!).order('paid_on', { ascending: false }).limit(6),
      ]);
      return { sub: sub.data, payments: pays.data ?? [] };
    },
  });
  if (!ready || q.isLoading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></View>;
  const plan = PLANS[q.data?.sub?.plan ?? 'smb'];
  const next = q.data?.sub?.next_billing_on;
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Subscription" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}>
        <View style={{ backgroundColor: colors.ink, borderRadius: 24, padding: 24, marginBottom: 24 }}>
          <Text color={colors.onDark}>Current plan</Text>
          <Text weight="extrabold" size={28} color={colors.white}>{plan.name}</Text>
          <Text color={colors.onDark} style={{ marginTop: 12 }}>{next ? `Next bill on ${fmt.format(new Date(next))}` : 'Billing starts soon'}</Text>
          <Text weight="medium" color={colors.onDark}>No commission on any order</Text>
        </View>
        <Text weight="bold" size={18} style={{ marginBottom: 8 }}>Payment history</Text>
        {!q.data?.payments.length ? <Text color={colors.muted}>No payments yet.</Text> : q.data.payments.map((p) => (
          <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <Text weight="medium">{fmt.format(new Date(p.paid_on))}</Text>
            <Text weight="semibold" style={{ textTransform: 'capitalize' }}>{p.status}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24, paddingBottom: Math.max(insets.bottom, 24), backgroundColor: colors.white }}>
        <Button label="Change plan" onPress={() => router.push('/onboarding/plan')} />
      </View>
    </View>
  );
}
