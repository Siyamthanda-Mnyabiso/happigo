import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, NavigationArrow, Storefront } from 'phosphor-react-native';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mapsLink, payOf, stageFor } from '@core/delivery';
import { formatRand } from '@core/money';
import { minutesToReady, orderCode } from '@core/orders';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';
import { BackButton, Button, Text } from '@native/ui';
import { Backdrop, Sheet } from '@/components/sheet';
import { SlideToConfirm } from '@/components/slide-to-confirm';
import { friendlyError, useDriver } from '@/lib/driver';
import { useNow } from '@/lib/now';

function Row({ left, right, bold, color }: { left: string; right: string; bold?: boolean; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text weight={bold ? 'bold' : 'regular'} color={bold ? colors.ink : colors.muted}>{left}</Text>
      <Text weight={bold ? 'extrabold' : 'semibold'} size={bold ? 20 : 16} color={color}>{right}</Text>
    </View>
  );
}

function NavCard({ title, address }: { title: string; address: string | null }) {
  const link = mapsLink(address);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${title}. Opens maps`}
      disabled={!link}
      onPress={() => link && Linking.openURL(link)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 24, backgroundColor: colors.ink }}
    >
      <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}>
        <NavigationArrow size={28} weight="fill" color={colors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text weight="bold" size={20} color={colors.white}>{title}</Text>
        <Text color={colors.onDark}>Open directions in Maps</Text>
      </View>
    </Pressable>
  );
}

export default function DeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { uid, ready } = useDriver();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const now = useNow(15_000);

  const q = useQuery({
    queryKey: ['delivery', id],
    enabled: ready,
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from('orders')
        .select(
          `id, status, customer_name, delivery_address, delivery_instructions, note, payment_method,
           driver_pay_cents, tip_cents, prep_minutes, accepted_at,
           branches(name, address, restaurants(name)),
           order_items(id, name, options, quantity)`,
        )
        .eq('id', id)
        .maybeSingle();
      if (err) throw err;
      return data;
    },
  });

  const step = useMutation({
    mutationFn: async (fn: 'mark_picked_up' | 'mark_delivered') => {
      const { error: err } = await supabase.rpc(fn, { oid: id });
      if (err) throw new Error(friendlyError(err));
    },
    onSuccess: async () => {
      setError(null);
      await Promise.all([qc.invalidateQueries({ queryKey: ['delivery', id] }), qc.invalidateQueries({ queryKey: ['active', uid] }), qc.invalidateQueries({ queryKey: ['delivered', uid] })]);
    },
    onError: (e: Error) => setError(e.message),
  });

  const goHome = () => router.replace('/');

  if (!ready || q.isLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></View>;
  }
  const o = q.data;
  if (!o) {
    return (
      <View style={{ flex: 1, padding: 24, paddingTop: insets.top + 24 }}>
        <Text weight="extrabold" size={24}>Delivery not found</Text>
        <Button label="Back to home" onPress={goHome} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const stage = stageFor(o.status);
  const restaurant = o.branches?.restaurants?.name ?? 'Restaurant';
  const pickupAddress = o.branches?.address ?? null;
  const itemCount = o.order_items.reduce((n, i) => n + i.quantity, 0);
  const earn = payOf(o);
  const err = error && <Text accessibilityRole="alert" color={colors.danger} style={{ marginTop: 12 }}>{error}</Text>;

  if (stage === 'closed') {
    return (
      <View style={{ flex: 1, padding: 24, paddingTop: insets.top + 24 }}>
        <Text weight="extrabold" size={24}>This delivery was cancelled</Text>
        <Button label="Back to home" onPress={goHome} style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (stage === 'done') {
    return (
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 48, paddingHorizontal: 24, paddingBottom: 40, alignItems: 'stretch' }}>
        <View style={{ alignSelf: 'center', width: 200, height: 200, borderRadius: 100, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: '#ffd5c4', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}>
              <Check size={48} weight="bold" color={colors.white} />
            </View>
          </View>
        </View>
        <Text weight="extrabold" size={30} accessibilityRole="header" style={{ textAlign: 'center', marginTop: 24 }}>Delivery complete</Text>
        <Text color={colors.muted} style={{ textAlign: 'center', marginBottom: 24 }}>{restaurant}</Text>
        <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 20, marginBottom: 32 }}>
          <Row left="Delivery fee" right={formatRand(earn - o.tip_cents)} />
          <Row left="Tip" right={formatRand(o.tip_cents)} />
          <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 6 }} />
          <Row left="You earned" right={formatRand(earn)} bold color={colors.brand} />
        </View>
        <Button label="Find next order" onPress={goHome} />
        <Button
          label="Go offline"
          variant="outline"
          style={{ marginTop: 12 }}
          onPress={async () => {
            await supabase.from('driver_profiles').update({ is_online: false }).eq('user_id', uid!);
            await qc.invalidateQueries({ queryKey: ['driver', uid] });
            goHome();
          }}
        />
      </ScrollView>
    );
  }

  if (stage === 'to-restaurant') {
    const mins = minutesToReady(o.accepted_at, o.prep_minutes, now);
    return (
      <Backdrop>
        <View style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16 }}>
          <NavCard title={restaurant} address={pickupAddress} />
        </View>
        <Sheet>
          <Text color={colors.muted}>Pick up from</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text weight="extrabold" size={24} accessibilityRole="header">{restaurant}</Text>
            <Text weight="semibold">{mins > 0 ? `Ready in ${mins} min` : 'Ready soon'}</Text>
          </View>
          <Text color={colors.muted}>{`${pickupAddress ?? ''} · Order #${orderCode(o.id)} · ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 14, borderRadius: 20, backgroundColor: colors.peach }}>
            <Storefront size={22} color={colors.brand} />
            <Text style={{ flex: 1 }}>This screen updates when the restaurant marks the order ready.</Text>
          </View>
          <View style={{ marginTop: 16 }}>
            <Text color={colors.muted}>You will earn <Text weight="bold">{formatRand(earn)}</Text>{o.tip_cents > 0 ? ` (includes ${formatRand(o.tip_cents)} tip)` : ''}</Text>
          </View>
        </Sheet>
      </Backdrop>
    );
  }

  if (stage === 'pickup') {
    return (
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: 140 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <BackButton onPress={goHome} label="Back to home" />
            <Text weight="semibold" size={18}>Pick up order</Text>
          </View>
          <Text color={colors.muted} style={{ marginBottom: 8 }}>Ready for pickup</Text>
          <View style={{ backgroundColor: colors.ink, borderRadius: 24, padding: 24, marginBottom: 24 }}>
            <Text color={colors.onDark}>Order code</Text>
            <Text weight="extrabold" size={44} color={colors.white} style={{ letterSpacing: 1 }}>{orderCode(o.id)}</Text>
            <Text color={colors.onDark}>Show this code to the restaurant</Text>
          </View>
          <Text weight="bold" size={18} style={{ marginBottom: 12 }}>Check the order</Text>
          {o.order_items.map((i) => (
            <Pressable
              key={i.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!checked[i.id] }}
              onPress={() => setChecked((c) => ({ ...c, [i.id]: !c[i.id] }))}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: checked[i.id] ? colors.ink : colors.white, borderWidth: 1.5, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                {checked[i.id] && <Check size={16} weight="bold" color={colors.white} />}
              </View>
              <Text style={{ flex: 1 }}>{`${i.quantity}x ${i.name}${i.options ? ` · ${i.options}` : ''}`}</Text>
            </Pressable>
          ))}
          {o.note ? (
            <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14, marginTop: 16 }}>
              <Text color={colors.muted}>Customer note</Text>
              <Text weight="semibold">{o.note}</Text>
            </View>
          ) : null}
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 14, marginTop: 16 }}>
            <Text color={colors.muted}>You will earn</Text>
            <Text weight="extrabold" size={20}>{formatRand(earn)}</Text>
            {o.tip_cents > 0 && <Text color={colors.muted}>{`Includes ${formatRand(o.tip_cents)} tip`}</Text>}
          </View>
        </ScrollView>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24, paddingBottom: Math.max(insets.bottom, 24), backgroundColor: colors.white }}>
          <Button label={step.isPending ? 'Confirming' : 'Confirm pickup'} disabled={step.isPending} onPress={() => step.mutate('mark_picked_up')} />
          {err}
        </View>
      </View>
    );
  }

  // to-customer
  return (
    <Backdrop>
      <View style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16 }}>
        <NavCard title="Navigate to customer" address={o.delivery_address} />
      </View>
      <Sheet>
        <Text color={colors.muted}>Deliver to</Text>
        <Text weight="extrabold" size={24} accessibilityRole="header">{o.customer_name ?? 'Customer'}</Text>
        <Text color={colors.muted}>{o.delivery_address}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 20 }}>
          <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, height: 36, justifyContent: 'center' }}>
            <Text weight="semibold">{o.payment_method === 'cash' ? 'Collect cash' : 'Paid by card'}</Text>
          </View>
          {o.delivery_instructions ? (
            <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, height: 36, justifyContent: 'center' }}>
              <Text weight="semibold">{o.delivery_instructions}</Text>
            </View>
          ) : null}
        </View>
        <SlideToConfirm label="Slide to confirm delivery" disabled={step.isPending} onComplete={() => step.mutate('mark_delivered')} />
        {err}
      </Sheet>
    </Backdrop>
  );
}
