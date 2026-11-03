import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Lock } from 'phosphor-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BANKS, bankSchema, last4 } from '@core/validation/bank';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';
import { Button, Pill, Text } from '@native/ui';
import { ScreenHeader } from '@/components/screen-header';
import { usePartner } from '@/lib/partner';

type Errors = Partial<Record<'bank' | 'accountHolder' | 'accountNumber' | 'branchCode' | 'form', string>>;

function Field({ label, error, ...props }: React.ComponentProps<typeof TextInput> & { label: string; error?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text weight="semibold" style={{ marginBottom: 8 }}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.mutedLight} style={{ height: 54, borderRadius: 16, backgroundColor: colors.card, paddingHorizontal: 16, fontFamily: 'Figtree_400Regular', fontSize: 16, color: colors.ink }} {...props} />
      {error ? <Text accessibilityRole="alert" color={colors.danger} style={{ marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

export default function BankScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { uid, partner } = usePartner();
  const [v, setV] = useState({ bank: '', accountHolder: '', accountNumber: '', branchCode: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (t: string) => setV((s) => ({ ...s, [k]: t }));

  async function save() {
    const parsed = bankSchema.safeParse(v);
    if (!parsed.success) {
      const e: Errors = {};
      for (const i of parsed.error.issues) e[i.path[0] as keyof Errors] ??= i.message;
      return setErrors(e);
    }
    if (!partner) return router.replace('/onboarding/plan');
    setErrors({});
    setBusy(true);
    // TODO(payments): the full account number goes to the payment provider (Paystack or Peach, TBC). We only ever store the last 4 digits.
    const { error } = await supabase.from('bank_accounts').upsert({
      restaurant_id: partner.restaurant.id,
      bank: parsed.data.bank,
      account_holder: parsed.data.accountHolder,
      account_last4: last4(parsed.data.accountNumber),
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) return setErrors({ form: 'Could not save your bank details. Try again.' });
    await qc.invalidateQueries({ queryKey: ['partner', uid] });
    router.replace('/');
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScreenHeader title="Connect your bank" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}>
        <Text color={colors.muted}>Step 3 of 3</Text>
        <Text weight="extrabold" size={28} accessibilityRole="header">Where should we pay you?</Text>
        <Text color={colors.muted} style={{ marginBottom: 24 }}>Customer payments go straight to this account. HappiGo never holds your money.</Text>
        <Text weight="semibold" style={{ marginBottom: 8 }}>Bank</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: errors.bank ? 4 : 16 }}>
          {BANKS.map((b) => <Pill key={b} label={b} active={v.bank === b} onPress={() => setV((s) => ({ ...s, bank: b }))} />)}
        </View>
        {errors.bank ? <Text accessibilityRole="alert" color={colors.danger} style={{ marginBottom: 12 }}>{errors.bank}</Text> : null}
        <Field label="Account holder" placeholder="As on your bank statement" value={v.accountHolder} onChangeText={set('accountHolder')} autoCapitalize="words" error={errors.accountHolder} />
        <Field label="Account number" placeholder="Enter account number" value={v.accountNumber} onChangeText={set('accountNumber')} keyboardType="number-pad" error={errors.accountNumber} />
        <Field label="Branch code" placeholder="Enter branch code" value={v.branchCode} onChangeText={set('branchCode')} keyboardType="number-pad" error={errors.branchCode} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.line }}>
          <Lock size={22} color={colors.muted} />
          <Text style={{ flex: 1 }}>Only the last 4 digits are kept. The rest is used for payouts only.</Text>
        </View>
        {errors.form ? <Text accessibilityRole="alert" color={colors.danger} style={{ marginTop: 12 }}>{errors.form}</Text> : null}
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24, paddingBottom: Math.max(insets.bottom, 24), backgroundColor: colors.white }}>
        <Button label={busy ? 'Saving' : 'Connect account'} disabled={busy} onPress={save} />
      </View>
    </KeyboardAvoidingView>
  );
}
