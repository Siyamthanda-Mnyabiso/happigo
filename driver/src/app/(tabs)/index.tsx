import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { MapPin, Storefront, User } from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { distanceLabel, periodStart, summarise } from '@core/delivery';
import { formatRand } from '@core/money';
import { itemCountLabel } from '@core/orders';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';
import { Button, Text } from '@native/ui';
import { Backdrop, Sheet } from '@/components/sheet';
import { SlideToConfirm } from '@/components/slide-to-confirm';
import { useActiveDelivery, useDelivered, useOffers, type Offer } from '@/lib/data';
import { friendlyError, useDriver } from '@/lib/driver';
import { useNow } from '@/lib/now';

function Chip({ children }: { children: string }) {
  return (
    <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, height: 36, justifyContent: 'center' }}>
      <Text weight="semibold">{children}</Text>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14 }}>
      <Text weight="extrabold" size={20}>{value}</Text>
      <Text color={colors.muted}>{label}</Text>
    </View>
  );
}

function OfferPanel({ offer, more, onDone }: { offer: Offer; more: number; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: 'accept_delivery' | 'decline_delivery') {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.rpc(fn, { oid: offer.order_id });
    if (err) {
      setBusy(false);
      setError(friendlyError(err));
      onDone();
      return;
    }
    if (fn === 'accept_delivery') router.push({ pathname: '/delivery/[id]', params: { id: offer.order_id } });
    setBusy(false);
    onDone();
  }

  return (
    <>
      <Text weight="semibold" color={colors.brand}>New delivery</Text>
      <Text weight="extrabold" size={40} accessibilityRole="header" style={{ marginTop: 4 }}>{formatRand(offer.driver_pay_cents)}</Text>
      <Text color={colors.muted}>{distanceLabel(offer.distance_km)} to the restaurant</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        {offer.tip_cents > 0 && <Chip>{`Tip included ${formatRand(offer.tip_cents)}`}</Chip>}
        <Chip>{itemCountLabel(offer.item_count)}</Chip>
      </View>
      <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 16 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' }}>
          <Storefront size={22} color={colors.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="semibold">{offer.restaurant_name}</Text>
          <Text color={colors.muted}>{offer.pickup_address}</Text>
          <Text color={colors.muted}>{offer.status === 'ready' ? 'Ready to collect' : 'Still being prepared'}</Text>
        </View>
      </View>
      {error && <Text accessibilityRole="alert" color={colors.danger} style={{ marginTop: 12 }}>{error}</Text>}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
        <Button label="Decline" variant="outline" disabled={busy} onPress={() => run('decline_delivery')} style={{ width: 112, paddingHorizontal: 0 }} />
        <Button label={busy ? 'Accepting' : 'Accept'} disabled={busy} onPress={() => run('accept_delivery')} style={{ flex: 1 }} />
      </View>
      {more > 0 && <Text color={colors.muted} style={{ textAlign: 'center', marginTop: 12 }}>{`${more} more waiting`}</Text>}
    </>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { uid, driver, name, ready } = useDriver();
  const online = driver?.is_online ?? false;
  const active = useActiveDelivery(uid);
  const offers = useOffers(uid, online);
  const delivered = useDelivered(uid);
  const [toggling, setToggling] = useState(false);
  const now = useNow();

  // Someone carrying a delivery goes straight back to it.
  useEffect(() => {
    if (active.data) router.push({ pathname: '/delivery/[id]', params: { id: active.data } });
  }, [active.data]);

  const today = useMemo(() => {
    const from = periodStart('today', now).getTime();
    return summarise((delivered.data ?? []).filter((r) => r.delivered_at && new Date(r.delivered_at).getTime() >= from));
  }, [delivered.data, now]);

  async function setOnline(value: boolean) {
    if (!uid) return;
    setToggling(true);
    await supabase.from('driver_profiles').update({ is_online: value }).eq('user_id', uid);
    await qc.invalidateQueries({ queryKey: ['driver', uid] });
    setToggling(false);
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  const list = offers.data ?? [];
  const first = online ? list[0] : undefined;

  return (
    <Backdrop rings={online && !first}>
      <View style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 12, borderRadius: 24, backgroundColor: colors.white }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} color={colors.brand} />
          </View>
          <Text weight="semibold">{name}</Text>
        </View>
        <View accessibilityLabel={`Earned today ${formatRand(today.total)}`} style={{ height: 48, paddingHorizontal: 20, borderRadius: 24, backgroundColor: colors.ink, justifyContent: 'center' }}>
          <Text weight="bold" color={colors.white}>{formatRand(today.total)}</Text>
        </View>
      </View>

      <Sheet tabs={!first}>
        {first ? (
          <OfferPanel key={first.order_id} offer={first} more={list.length - 1} onDone={() => offers.refetch()} />
        ) : online ? (
          <>
            <Text weight="extrabold" size={24} accessibilityRole="header">Finding orders</Text>
            <Text color={colors.muted} style={{ marginBottom: 16 }}>New deliveries show up here as restaurants get orders.</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: colors.peach, marginBottom: 20 }}>
              <MapPin size={22} color={colors.brand} weight="fill" />
              <Text weight="semibold">You are online</Text>
            </View>
            <SlideToConfirm tone="dark" label="Slide to go offline" disabled={toggling} onComplete={() => setOnline(false)} />
          </>
        ) : (
          <>
            <Text weight="extrabold" size={24} accessibilityRole="header">You are offline</Text>
            <Text color={colors.muted} style={{ marginBottom: 16 }}>Go online to start receiving orders.</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <Stat value={String(today.trips)} label="Trips today" />
              <Stat value={formatRand(today.total)} label="Earned today" />
              <Stat value={formatRand(today.tips)} label="Tips today" />
            </View>
            <SlideToConfirm label="Slide to go online" disabled={toggling} onComplete={() => setOnline(true)} />
          </>
        )}
      </Sheet>
    </Backdrop>
  );
}
