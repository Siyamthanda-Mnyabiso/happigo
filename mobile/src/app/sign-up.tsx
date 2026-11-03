import { Link, router, useLocalSearchParams } from 'expo-router';
import { Envelope, Lock, User } from 'phosphor-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { AuthField } from '@native/auth-field';
import { BrandHeader } from '@native/brand-header';
import { Button, Text } from '@native/ui';
import { safeNext } from '@/lib/require-auth';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name'),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ next?: string }>();
  const next = safeNext(params.next);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<'fullName' | 'email' | 'password' | 'form', string>>>({});
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const e: typeof errors = {};
      for (const i of parsed.error.issues) e[i.path[0] as keyof typeof e] ??= i.message;
      return setErrors(e);
    }
    setBusy(true);
    setErrors({});
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { role: 'customer', full_name: parsed.data.fullName } },
    });
    setBusy(false);
    if (error) {
      return setErrors({ form: /already/i.test(error.message) ? 'An account with this email already exists. Sign in instead.' : 'Could not create your account. Try again.' });
    }
    if (data.session) router.replace(next as never);
    else setCheckEmail(true);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <BrandHeader topInset={insets.top} />
        <View style={{ paddingHorizontal: 24 }}>
          <Text weight="extrabold" size={30} accessibilityRole="header" style={{ marginTop: 32 }}>Create your account</Text>
          <Text color={colors.muted} style={{ marginBottom: 24 }}>No service fee. No hidden charges at checkout.</Text>
          {checkEmail ? (
            <View accessibilityRole="alert" style={{ padding: 20, borderRadius: 22, borderWidth: 1, borderColor: colors.line }}>
              <Text weight="bold" size={18}>Check your email</Text>
              <Text color={colors.muted}>We sent you a link to confirm your account. Then sign in to order.</Text>
              <Link href={{ pathname: '/sign-in', params: { next } }} style={{ marginTop: 12, color: colors.brand, fontFamily: 'Figtree_600SemiBold' }}>Go to sign in</Link>
            </View>
          ) : (
            <>
              <AuthField label="Your name" icon={<User size={22} color={colors.muted} />} value={form.fullName} onChangeText={set('fullName')} autoCapitalize="words" autoComplete="name" placeholder="Your name" error={errors.fullName} />
              <AuthField label="Email" icon={<Envelope size={22} color={colors.muted} />} value={form.email} onChangeText={set('email')} keyboardType="email-address" autoComplete="email" placeholder="name@email.com" error={errors.email} />
              <AuthField label="Password" icon={<Lock size={22} color={colors.muted} />} value={form.password} onChangeText={set('password')} secureTextEntry autoComplete="new-password" placeholder="At least 8 characters" error={errors.password} onSubmitEditing={submit} />
              {errors.form && <Text accessibilityRole="alert" color={colors.danger} style={{ marginBottom: 12 }}>{errors.form}</Text>}
              <Button label={busy ? 'Creating account' : 'Create account'} onPress={submit} disabled={busy} />
            </>
          )}
          <Text weight="semibold" style={{ textAlign: 'center', marginTop: 32 }}>
            Already have an account?{' '}
            <Link href={{ pathname: '/sign-in', params: { next } }} style={{ color: colors.brand }}>Sign in</Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
