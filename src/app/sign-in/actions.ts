'use server';

import { redirect } from 'next/navigation';
import { safeNext } from '@/lib/cart';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';

export type AuthState = {
  errors?: Partial<Record<'fullName' | 'email' | 'password' | 'form', string>>;
  checkEmail?: boolean;
};

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = safeNext(String(formData.get('next') ?? ''), routes.customer.home);
  if (!email || !password) return { errors: { password: 'Enter your email and password' } };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { errors: { password: 'Email or password is not right' } };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profile?.role !== 'customer') {
    await supabase.auth.signOut();
    return { errors: { form: 'This is not a customer account. Create one to order food.' } };
  }
  redirect(next);
}
