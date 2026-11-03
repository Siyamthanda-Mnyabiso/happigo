import { Link, router } from 'expo-router';
import { Envelope, Lock, Phone, User } from 'phosphor-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { AuthField } from '@native/auth-field';
import { BrandHeader } from '@native/brand-header';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';
import { Button, Text } from '@native/ui';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  phone: z.string().trim().regex(/^\+?\d[\d\s]{8,14}$/, 'Enter a valid phone number'),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});
type Errors = Partial<Record<'fullName' | 'phone' | 'email' | 'password' | 'form', string>>;

export default function JoinScreen() {
  const insets = useSafeAreaInsets();
  const [v, setV] = useState({ fullName: '', phone: '', email: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const set = (k: keyof typeof v) => (t: string) => setV((s) => ({ ...s, [k]: t }));

  async function submit() {
    const parsed = schema.safeParse(v);
    if (!parsed.success) {
      const e: Errors = {};
      for (const i of parsed.error.issues) e[i.path[0] as keyof Errors] ??= i.message;
      return setErrors(e);
    }
    setErrors({});
    setBusy(true);
    const { fullName, phone, email, password } = parsed.data;
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { role: 'driver', full_name: fullName, phone } } });
    setBusy(false);
    if (error) {
      const exists = /already/i.test(error.message);
      return setErrors({ form: exists ? 'An account with this email already exists. Sign in instead.' : 'Could not create your account. Try again.' });
    }
    if (data.session) router.replace('/');
    else setCheckEmail(true);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <BrandHeader topInset={insets.top} badge="Free to join" />
        <View style={{ paddingHorizontal: 24 }}>
          <Text weight="extrabold" size={30} accessibilityRole="header" style={{ marginTop: 32 }}>Join as a driver</Text>
          <Text color={colors.muted} style={{ marginBottom: 24 }}>Create your account in minutes.</Text>
          {checkEmail ? (
            <View accessibilityRole="alert" style={{ padding: 20, borderRadius: 22, borderWidth: 1, borderColor: colors.line }}>
              <Text weight="bold" size={18}>Check your email</Text>
              <Text color={colors.muted}>We sent you a link to confirm your account. Then sign in to start earning.</Text>
            </View>
          ) : (
            <>
              <AuthField label="Full name" icon={<User size={22} color={colors.muted} />} value={v.fullName} onChangeText={set('fullName')} autoCapitalize="words" autoComplete="name" placeholder="Your name" error={errors.fullName} />
              <AuthField label="Phone number" icon={<Phone size={22} color={colors.muted} />} value={v.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoComplete="tel" placeholder="+27 82 000 0000" error={errors.phone} />
              <AuthField label="Email" icon={<Envelope size={22} color={colors.muted} />} value={v.email} onChangeText={set('email')} keyboardType="email-address" autoComplete="email" placeholder="name@email.com" error={errors.email} />
              <AuthField label="Password" icon={<Lock size={22} color={colors.muted} />} value={v.password} onChangeText={set('password')} secureTextEntry autoComplete="new-password" placeholder="At least 8 characters" error={errors.password} onSubmitEditing={submit} />
              {errors.form && <Text accessibilityRole="alert" color={colors.danger} style={{ marginBottom: 12 }}>{errors.form}</Text>}
              <Button label={busy ? 'Creating account' : 'Create free account'} onPress={submit} disabled={busy} />
              <View style={{ marginTop: 24, padding: 16, borderRadius: 20, backgroundColor: colors.card }}>
                <Text weight="semibold">Joining is free</Text>
                <Text color={colors.muted}>No sign up fee. No monthly fee.</Text>
              </View>
            </>
          )}
          <Text color={colors.muted} style={{ textAlign: 'center', marginTop: 24 }}>
            Already a driver?{' '}
            <Link href="/sign-in" style={{ color: colors.brand, fontFamily: 'Figtree_600SemiBold' }}>Sign in</Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
