'use server';

import { redirect } from 'next/navigation';
import { getPartner } from '@/lib/restaurant';
import { routes } from '@/lib/routes';
import { bankSchema, last4 } from '@/lib/validation/bank';

export type BankField = 'bank' | 'accountHolder' | 'accountNumber' | 'branchCode' | 'form';
export type BankState = { errors?: Partial<Record<BankField, string>> };

export async function saveBank(_prev: BankState, formData: FormData): Promise<BankState> {
  const parsed = bankSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: NonNullable<BankState['errors']> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path[0] as BankField] ??= issue.message;
    }
    return { errors };
  }
  const { supabase, restaurant } = await getPartner();
  if (!restaurant) redirect(routes.restaurant.planOnboarding);

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
  redirect(routes.restaurant.orders);
}
