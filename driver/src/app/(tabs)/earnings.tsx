import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PERIODS, payOf, periodStart, summarise, type Period } from '@core/delivery';
import { formatRand } from '@core/money';
import { colors } from '@native/theme';
import { Pill, Text } from '@native/ui';
import { useDelivered } from '@/lib/data';
import { useDriver } from '@/lib/driver';
import { useNow } from '@/lib/now';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const SAST = 2 * 3600 * 1000;
const fmt = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' });

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const { uid } = useDriver();
  const q = useDelivered(uid);
  const [period, setPeriod] = useState<Period>('today');
  const now = useNow();

  const { rows, sums, week, todayIndex } = useMemo(() => {
    const all = q.data ?? [];
    const since = (p: Period) => periodStart(p, now).getTime();
    const inPeriod = (p: Period) => all.filter((r) => r.delivered_at && new Date(r.delivered_at).getTime() >= since(p));
    const weekRows = inPeriod('week');
    // Pay per day this week, Monday first, using South African days.
    const perDay = [0, 0, 0, 0, 0, 0, 0];
    for (const r of weekRows) {
      const local = new Date(new Date(r.delivered_at!).getTime() + SAST);
      perDay[(local.getUTCDay() + 6) % 7] += payOf(r);
    }
    return { rows: inPeriod(period), sums: summarise(inPeriod(period)), week: perDay, todayIndex: (new Date(now + SAST).getUTCDay() + 6) % 7 };
  }, [q.data, period, now]);

  const label = PERIODS.find((p) => p.id === period)!.label;
  const top = Math.max(...week, 1);

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 130 }}>
      <Text weight="extrabold" size={30} accessibilityRole="header" style={{ marginBottom: 16 }}>Earnings</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {PERIODS.map((p) => (
          <Pill key={p.id} label={p.label} active={p.id === period} onPress={() => setPeriod(p.id)} />
        ))}
      </View>
      <View style={{ backgroundColor: colors.ink, borderRadius: 24, padding: 24, marginBottom: 16 }}>
        <Text color={colors.onDark}>{period === 'today' ? 'Today' : `This ${label.toLowerCase()}`}</Text>
        <Text weight="extrabold" size={40} color={colors.white}>{formatRand(sums.total)}</Text>
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
        {[
          [String(sums.trips), 'Trips'],
          [formatRand(sums.trips ? Math.round(sums.total / sums.trips) : 0), 'Per trip'],
          [formatRand(sums.tips), 'Tips'],
        ].map(([v, l]) => (
          <View key={l} style={{ flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14 }}>
            <Text weight="extrabold" size={18}>{v}</Text>
            <Text color={colors.muted}>{l}</Text>
          </View>
        ))}
      </View>

      <Text weight="bold" size={18} style={{ marginBottom: 8 }}>Deliveries</Text>
      {!rows.length ? (
        <Text color={colors.muted}>No deliveries in this period yet.</Text>
      ) : (
        rows.map((r) => (
          <View key={r.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <View>
              <Text weight="medium">{r.restaurant}</Text>
              <Text color={colors.muted}>{r.delivered_at ? fmt.format(new Date(r.delivered_at)) : ''}</Text>
            </View>
            <Text weight="semibold">{formatRand(payOf(r))}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
