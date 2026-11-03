'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { routes } from '@/lib/routes';
import { createClient } from '@/lib/supabase/server';

export type JoinState = {
  errors?: Partial<Record<'fullName' | 'phone' | 'email' | 'password' | 'form', string>>;
  checkEmail?: boolean;
};

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d[\d\s]{8,14}$/, 'Enter a valid phone number'),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

export async function join(_prev: JoinState, formData: FormData): Promise<JoinState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: NonNullable<JoinState['errors']> = {};
    for (const i of parsed.error.issues) errors[i.path[0] as keyof typeof errors] ??= i.message;
    return { errors };
  }
  const { fullName, phone, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'driver', full_name: fullName, phone } },
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
  if (data.session) redirect(routes.driver.home);
  return { checkEmail: true };
}
