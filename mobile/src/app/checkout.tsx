import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Chat, CreditCard, MapPin, Moped, Money, Storefront } from 'phosphor-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '@/components/page-header';
import { Text } from '@/components/ui';
import { useAddresses } from '@/lib/account';
import { useCart } from '@/lib/cart';
import { useCartView } from '@/lib/data';
import { useRequireAuth } from '@/lib/require-auth';
import { supabase } from '@/lib/supabase';
import { TIP_OPTIONS_CENTS } from '@core/cart';
import { formatRand } from '@core/money';
import { colors, shadow } from '@/theme';

const box = { height: 56, borderRadius: 16, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 } as const;
const input = { flex: 1, fontFamily: 'Figtree_400Regular', fontSize: 16, color: colors.ink, height: 56 } as const;

function Heading({ children }: { children: string }) {
  return <Text weight="bold" size={17} accessibilityRole="header" style={{ marginTop: 24, marginBottom: 12 }}>{children}</Text>;
}

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useRequireAuth();
  const { cart, clear } = useCart();
  const { data: view } = useCartView(cart);
  const { data: addresses } = useAddresses();
  const qc = useQueryClient();
  const [address, setAddress] = useState<string | null>(null);
  const [instructions, setInstructions] = useState('');
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState<'card' | 'cash'>('card');
  const [tip, setTip] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const shownAddress = address ?? addresses?.[0]?.address ?? '';
  if (!session || !view) {
    return (
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 24 }}>
        <PageHeader title="Checkout" />
        <Text color={colors.muted} style={{ marginTop: 24 }}>{session ? 'Your cart is empty.' : 'Loading'}</Text>
      </View>
    );
  }
  const { totals } = view;
  const total = totals.food + totals.deliveryFee + tip;

  async function place() {
    if (shownAddress.trim().length < 8) return setError('Enter your full delivery address.');
    setBusy(true);
    setError(null);
    const { data: orderId, error: err } = await supabase.rpc('place_order', {
      p_branch: cart.branchId!,
      p_items: cart.lines.map((l) => ({ id: l.id, qty: l.qty })),
      p_address: shownAddress.trim(),
      p_instructions: instructions.trim(),
      p_note: note.trim(),
      p_payment: payment,
      p_tip: tip,
    });
    setBusy(false);
    if (err || !orderId) {
      // Our database functions raise plain language messages with code 23514 on purpose. Show those, hide the rest.
      return setError(err?.code === '23514' ? err.message : 'Something went wrong. Try again.');
    }
    if (!addresses?.some((a) => a.address === shownAddress.trim())) {
      await supabase.from('customer_addresses').insert({ user_id: session!.user.id, label: 'Home', address: shownAddress.trim() });
      qc.invalidateQueries({ queryKey: ['addresses'] });
    }
    qc.invalidateQueries({ queryKey: ['orders'] });
    clear();
    router.replace(`/order/${orderId}`);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: 240 }}>
        <PageHeader title="Checkout" />

        <Heading>Delivery address</Heading>
        <View style={[box, { borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white }]}>
          <MapPin size={24} weight="bold" color={colors.brand} />
          <TextInput accessibilityLabel="Delivery address" value={shownAddress} onChangeText={setAddress} placeholder="Street, suburb, city" placeholderTextColor={colors.mutedLight} autoComplete="street-address" style={input} />
        </View>

        <Heading>Delivery time</Heading>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: colors.brand, backgroundColor: colors.peach }}>
          <Moped size={24} weight="bold" color={colors.brand} />
          <View>
            <Text weight="semibold">ASAP</Text>
            <Text color={colors.muted}>As soon as the restaurant has it ready</Text>
          </View>
        </View>

        <Heading>Payment</Heading>
        <View style={{ gap: 12 }}>
          {([['card', 'Card', 'Pay now', CreditCard], ['cash', 'Cash on delivery', 'Pay your driver', Money]] as const).map(([value, label, detail, Icon]) => {
            const on = payment === value;
            return (
              <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => setPayment(value)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: on ? colors.brand : colors.line }}>
                <Icon size={24} weight="bold" color={on ? colors.brand : colors.muted} />
                <View style={{ flex: 1 }}>
                  <Text weight="semibold">{label}</Text>
                  <Text color={colors.muted}>{detail}</Text>
                </View>
                <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: on ? colors.brand : colors.line, alignItems: 'center', justifyContent: 'center' }}>
                  {on && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.brand }} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Heading>Tip your driver</Heading>
        <Text color={colors.muted} style={{ marginTop: -4, marginBottom: 12 }}>All of it goes to your driver.</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {TIP_OPTIONS_CENTS.map((c) => {
            const on = tip === c;
            return (
              <Pressable key={c} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => setTip(c)} style={{ flex: 1, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: on ? colors.brand : colors.line, backgroundColor: on ? colors.brand : colors.white, alignItems: 'center', justifyContent: 'center' }}>
                <Text weight="semibold" color={on ? colors.white : colors.ink}>{c === 0 ? 'None' : formatRand(c)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Heading>Note for rider</Heading>
        <View style={box}>
          <Chat size={24} weight="bold" color={colors.muted} />
          <TextInput accessibilityLabel="Note for rider" value={instructions} onChangeText={setInstructions} placeholder="e.g. Gate code 1234" placeholderTextColor={colors.mutedLight} style={input} />
        </View>
        <Heading>Note for the restaurant</Heading>
        <View style={box}>
          <Storefront size={24} weight="bold" color={colors.muted} />
          <TextInput accessibilityLabel="Note for the restaurant" value={note} onChangeText={setNote} placeholder="e.g. No onions" placeholderTextColor={colors.mutedLight} style={input} />
        </View>
      </ScrollView>

      <View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line }]}>
        <View style={{ gap: 4, marginBottom: 12 }}>
          {([['Food', totals.food], ['Delivery fee', totals.deliveryFee], ...(tip ? [['Tip', tip]] : [])] as [string, number][]).map(([l, c]) => (
            <View key={l} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text color={colors.muted}>{l}</Text>
              <Text color={colors.muted}>{formatRand(c)}</Text>
            </View>
          ))}
        </View>
        {error && <Text accessibilityRole="alert" color={colors.danger} style={{ marginBottom: 8 }}>{error}</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View>
            <Text color={colors.muted}>Total</Text>
            <Text weight="extrabold" size={24}>{formatRand(total)}</Text>
          </View>
          <Pressable accessibilityRole="button" disabled={busy} onPress={place} style={[{ flex: 1, height: 56, borderRadius: 28, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }, shadow.brand]}>
            <Text weight="semibold" color={colors.white}>{busy ? 'Placing order' : 'Place order'}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
