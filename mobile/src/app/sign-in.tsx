import { Link, router, useLocalSearchParams } from 'expo-router';
import { Lock, User } from 'phosphor-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthField } from '@native/auth-field';
import { BrandHeader } from '@native/brand-header';
import { Button, Text } from '@native/ui';
import { safeNext } from '@/lib/require-auth';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ next?: string }>();
  const next = safeNext(params.next);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) return setError('Enter your email and password');
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err || !data.user) {
      setBusy(false);
      return setError('Email or password is not right');
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    if (profile?.role !== 'customer') {
      await supabase.auth.signOut();
      setBusy(false);
      return setError('This is not a customer account. Create one to order food.');
    }
    router.replace(next as never);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <BrandHeader topInset={insets.top} />
        <View style={{ paddingHorizontal: 24 }}>
          <Text weight="extrabold" size={30} accessibilityRole="header" style={{ marginTop: 32 }}>Welcome back</Text>
          <Text color={colors.muted} style={{ marginBottom: 24 }}>Sign in to order your next meal.</Text>
          <AuthField label="Email" icon={<User size={22} color={colors.muted} />} value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" placeholder="name@email.com" />
          <AuthField label="Password" icon={<Lock size={22} color={colors.muted} />} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" placeholder="Enter your password" onSubmitEditing={submit} />
          {error && <Text accessibilityRole="alert" color={colors.danger} style={{ marginBottom: 12 }}>{error}</Text>}
          <Button label={busy ? 'Signing in' : 'Sign in'} onPress={submit} disabled={busy} />
          <Text weight="semibold" style={{ textAlign: 'center', marginTop: 32 }}>
            New here?{' '}
            <Link href={{ pathname: '/sign-up', params: { next } }} style={{ color: colors.brand }}>Create account</Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
