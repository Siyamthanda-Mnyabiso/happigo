import { describe, expect, it } from 'vitest';
import { bankSchema, last4 } from './bank';

const ok = {
  bank: 'FNB',
  accountHolder: 'Burger Shack',
  accountNumber: '62000004821',
  branchCode: '250655',
};

describe('bankSchema', () => {
  it('accepts valid details', () => {
    expect(bankSchema.safeParse(ok).success).toBe(true);
  });
  it('rejects letters in the account number', () => {
    expect(bankSchema.safeParse({ ...ok, accountNumber: '62A00' }).success).toBe(false);
  });
  it('rejects a short branch code', () => {
    expect(bankSchema.safeParse({ ...ok, branchCode: '2506' }).success).toBe(false);
  });
  it('shows only the last 4 digits', () => {
    expect(last4('62000004821')).toBe('4821');
  });
});
