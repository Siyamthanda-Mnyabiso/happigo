import { getDriver } from '@/lib/driver';
import { DriverTabs } from './driver-tabs';

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  await getDriver(); // sends anyone who isn't a signed-in driver to sign in
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] px-6 pb-28 pt-6">
      {children}
      <DriverTabs />
    </div>
  );
}
