import { router } from 'expo-router';
import { CreditCard } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PERIODS, periodStart, type Period } from '@core/delivery';
import { formatRand } from '@core/money';
import { colors } from '@native/theme';
import { Pill, Text } from '@native/ui';
import { usePayouts, useSales } from '@/lib/data';
import { useNow } from '@/lib/now';
import { usePartner } from '@/lib/partner';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const SAST = 2 * 3600 * 1000;
const day = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' });

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const { uid, partner, ready } = usePartner({ onboarded: true });
  const sales = useSales(uid);
  const payouts = usePayouts(partner?.restaurant.id, 1);
  const now = useNow();
  const [period, setPeriod] = useState<Period>('today');

  const { total, count, week, todayIndex } = useMemo(() => {
    const rows = sales.data ?? [];
    const at = (r: { delivered_at: string | null }) => (r.delivered_at ? new Date(r.delivered_at).getTime() : 0);
    const inPeriod = rows.filter((r) => at(r) >= periodStart(period, now).getTime());
    const perDay = [0, 0, 0, 0, 0, 0, 0];
    for (const r of rows.filter((x) => at(x) >= periodStart('week', now).getTime())) perDay[(new Date(at(r) + SAST).getUTCDay() + 6) % 7] += r.food_cents;
    return { total: inPeriod.reduce((n, r) => n + r.food_cents, 0), count: inPeriod.length, week: perDay, todayIndex: (new Date(now + SAST).getUTCDay() + 6) % 7 };
  }, [sales.data, period, now]);

  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></View>;
  const top = Math.max(...week, 1);
  const label = PERIODS.find((p) => p.id === period)!.label;
  const last = payouts.data?.[0];

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 130 }}>
      <Text weight="extrabold" size={30} accessibilityRole="header" style={{ marginBottom: 16 }}>Earnings</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>{PERIODS.map((p) => <Pill key={p.id} label={p.label} active={p.id === period} onPress={() => setPeriod(p.id)} />)}</View>
      <View style={{ backgroundColor: colors.ink, borderRadius: 24, padding: 24, marginBottom: 16 }}>
        <Text color={colors.onDark}>{period === 'today' ? 'Today' : `This ${label.toLowerCase()}`}</Text>
        <Text weight="extrabold" size={40} color={colors.white}>{formatRand(total)}</Text>
        <Text color={colors.onDark}>Food sales. No commission taken.</Text>
      </View>
      <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 24, padding: 16, marginBottom: 16 }}>
        <Text weight="bold" style={{ marginBottom: 12 }}>This week</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120 }}>
          {week.map((v, i) => (
            <View key={i} accessibilityLabel={`${DAYS[i]} ${formatRand(v)}`} style={{ alignItems: 'center', width: 34 }}>
              <View style={{ width: 30, height: Math.max(8, (v / top) * 96), borderRadius: 10, backgroundColor: i === todayIndex ? colors.brand : '#e8e0db' }} />
              <Text color={i === todayIndex ? colors.ink : colors.muted} weight={i === todayIndex ? 'bold' : 'regular'} style={{ marginTop: 6 }}>{DAYS[i]}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
        {[[String(count), 'Orders'], [formatRand(count ? Math.round(total / count) : 0), 'Avg order']].map(([v, l]) => (
          <View key={l} style={{ flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 }}><Text weight="extrabold" size={18}>{v}</Text><Text color={colors.muted}>{l}</Text></View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text weight="bold" size={18}>Recent payouts</Text>
        <Text weight="semibold" color={colors.brand} accessibilityRole="link" onPress={() => router.push('/payouts')}>See all</Text>
      </View>
      {last ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/payouts')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 20, padding: 14 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}><CreditCard size={20} color={colors.brand} /></View>
          <View style={{ flex: 1 }}><Text weight="semibold">{`Payout · ${day.format(new Date(last.paid_on))}`}</Text><Text color={colors.muted} style={{ textTransform: 'capitalize' }}>{last.status}</Text></View>
          <Text weight="bold">{formatRand(last.amount_cents)}</Text>
        </Pressable>
      ) : <Text color={colors.muted}>No payouts yet.</Text>}
    </ScrollView>
  );
}
