import { CartBar } from './cart-bar';
import { CustomerTabs } from './customer-tabs';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] px-6 pb-44 pt-6">
      {children}
      <CartBar />
      <CustomerTabs />
    </div>
  );
}
