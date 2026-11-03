'use client';

import { useActionState } from 'react';
import { LockIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Field, Select } from '@/components/ui/form';
import { BANKS } from '@/lib/validation/bank';
import { saveBank, type BankState } from './actions';

export function BankForm() {
  const [state, action, pending] = useActionState<BankState, FormData>(saveBank, {});
  const e = state.errors ?? {};
  return (
    <form action={action} noValidate className="flex flex-1 flex-col">
      <Select label="Bank" name="bank" defaultValue="" error={e.bank}>
        <option value="" disabled>
          Choose your bank
        </option>
        {BANKS.map((b) => (
          <option key={b}>{b}</option>
        ))}
      </Select>
      <Field
        label="Account holder"
        name="accountHolder"
        placeholder="As on your bank statement"
        error={e.accountHolder}
        autoComplete="off"
      />
      <Field
        label="Account number"
        name="accountNumber"
        inputMode="numeric"
        placeholder="Enter account number"
        error={e.accountNumber}
        autoComplete="off"
      />
      <Field
        label="Branch code"
        name="branchCode"
        inputMode="numeric"
        placeholder="Enter branch code"
        error={e.branchCode}
        autoComplete="off"
      />
      <p className="flex items-center gap-3 rounded-2xl border border-line p-4 font-medium">
        <LockIcon weight="bold" className="size-6 shrink-0" aria-hidden /> Encrypted and only used
        for payouts
      </p>
      {e.form && (
        <p role="alert" className="mt-3 text-base text-danger">
          {e.form}
        </p>
      )}
      <div className="mt-auto pt-8">
        <Button type="submit" disabled={pending}>
          {pending ? 'Connecting' : 'Connect account'}
        </Button>
      </div>
    </form>
  );
}
