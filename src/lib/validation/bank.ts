import { z } from 'zod';

export const BANKS = ['FNB', 'Standard Bank', 'Absa', 'Nedbank', 'Capitec'] as const;

export const bankSchema = z.object({
  bank: z.enum(BANKS, { error: 'Choose your bank' }),
  accountHolder: z.string().trim().min(2, 'Enter the name on the account'),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{6,16}$/, 'Account number is 6 to 16 digits'),
  branchCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Branch code is 6 digits'),
});

export type BankInput = z.infer<typeof bankSchema>;

/** Only the last 4 digits are ever shown back to the user. */
export function last4(accountNumber: string): string {
  return accountNumber.slice(-4);
}
