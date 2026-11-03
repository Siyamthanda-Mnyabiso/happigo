import { Screen } from '@/components/ui/screen';
import { BankForm } from './bank-form';

export default function ConnectBankPage() {
  return (
    <Screen>
      <p className="mt-4 font-medium text-muted">Step 3 of 3</p>
      <h1 className="text-2xl font-extrabold">Where should we pay you?</h1>
      <p className="mb-6 text-muted">
        Customer payments go straight to this account. HappiGo never holds your money.
      </p>
      <BankForm />
    </Screen>
  );
}
