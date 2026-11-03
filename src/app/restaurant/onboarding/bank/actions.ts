'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { bankSchema, last4 } from '@/lib/validation/bank';

export type BankState = {
  errors?: Partial<
    Record<'bank' | 'accountHolder' | 'accountNumber' | 'branchCode' | 'form', string>
  >;
};

export async function saveBank(_prev: BankState, formData: FormData): Promise<BankState> {
  const parsed = bankSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: NonNullable<BankState['errors']> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]) as keyof typeof errors;
      errors[key] ??= issue.message;
    }
    return { errors };
  }
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/restaurant/sign-in');
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', auth.user.id)
    .maybeSingle();
  if (!restaurant) redirect('/restaurant/onboarding/plan');

  // TODO(payments): send the full account number to the payment provider (Paystack or Peach, TBC)
  // to create a split-payment recipient. We only ever store the last 4 digits.
  const { error } = await supabase.from('bank_accounts').upsert({
    restaurant_id: restaurant.id,
    bank: parsed.data.bank,
    account_holder: parsed.data.accountHolder,
    account_last4: last4(parsed.data.accountNumber),
    updated_at: new Date().toISOString(),
  });
  if (error) return { errors: { form: 'Could not save your bank details. Try again.' } };
  redirect('/restaurant/orders');
}
