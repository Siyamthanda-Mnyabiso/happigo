'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { safeNext } from '@/lib/cart';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';
import type { AuthState } from '../sign-in/actions';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name'),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: NonNullable<AuthState['errors']> = {};
    for (const i of parsed.error.issues) errors[i.path[0] as keyof typeof errors] ??= i.message;
    return { errors };
  }
  const next = safeNext(String(formData.get('next') ?? ''), routes.customer.home);
  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'customer', full_name: fullName } },
  });
  if (error) {
    const exists = /already/i.test(error.message);
    return {
      errors: {
        form: exists
          ? 'An account with this email already exists. Sign in instead.'
          : 'Could not create your account. Try again.',
      },
    };
  }
  if (data.session) redirect(next);
  return { checkEmail: true };
}
