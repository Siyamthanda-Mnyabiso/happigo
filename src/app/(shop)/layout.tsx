import { CartBar } from './cart-bar';
import { CustomerTabs } from './customer-tabs';
import { ShopHeader } from './shop-header';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ShopHeader />
      <div className="mx-auto w-full max-w-6xl px-5 pb-44 pt-6 md:px-8 md:pb-28">{children}</div>
      <CartBar />
      <div className="md:hidden">
        <CustomerTabs />
      </div>
    </>
  );
}
