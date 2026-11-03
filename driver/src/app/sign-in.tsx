import { Link, router } from 'expo-router';
import { Lock, User } from 'phosphor-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthField } from '@native/auth-field';
import { BrandHeader } from '@native/brand-header';
import { supabase } from '@native/supabase';
import { colors } from '@native/theme';
import { Button, Text } from '@native/ui';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
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
    const { data: driver } = await supabase.from('driver_profiles').select('user_id').eq('user_id', data.user.id).maybeSingle();
    if (!driver) {
      await supabase.auth.signOut();
      setBusy(false);
      return setError('This is not a driver account. Join as a driver to start earning.');
    }
    router.replace('/');
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
        <BrandHeader topInset={insets.top} badge="Driver app" />
        <View style={{ paddingHorizontal: 24 }}>
          <Text weight="extrabold" size={30} accessibilityRole="header" style={{ marginTop: 32 }}>Driver sign in</Text>
          <Text color={colors.muted} style={{ marginBottom: 24 }}>Sign in to start earning with HappiGo.</Text>
          <AuthField label="Email" icon={<User size={22} color={colors.muted} />} value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" placeholder="name@email.com" />
          <AuthField label="Password" icon={<Lock size={22} color={colors.muted} />} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" placeholder="Enter your password" onSubmitEditing={submit} />
          {error && <Text accessibilityRole="alert" color={colors.danger} style={{ marginBottom: 12 }}>{error}</Text>}
          <Button label={busy ? 'Signing in' : 'Sign in'} onPress={submit} disabled={busy} />
          <View style={{ marginTop: 28, padding: 16, borderRadius: 20, backgroundColor: colors.card }}>
            <Text weight="semibold">Want to deliver with us?</Text>
            <Text color={colors.muted}>Free to join. Sign up in minutes.</Text>
            <Link href="/join" style={{ marginTop: 8 }}>
              <Text weight="semibold" color={colors.brand}>Join as a driver</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
