import { CustomerTabs } from '../customer-tabs';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="px-6 pb-32 pt-12">{children}</div>
      <CustomerTabs />
    </>
  );
}
