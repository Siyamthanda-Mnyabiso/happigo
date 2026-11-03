import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shop/page-header';
import { loadCartView } from '@/lib/cart-view';
import { getCustomer } from '@/lib/customer';
import { routes } from '@/lib/routes';
import { CheckoutForm } from './checkout-form';

export default async function CheckoutPage() {
  const { supabase, user } = await getCustomer(routes.customer.checkout);
  const view = await loadCartView();
  if (!view) redirect(routes.customer.cart);
  const { data: last } = await supabase
    .from('customer_addresses')
    .select('address')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (
    <div className="px-6 pt-12">
      <PageHeader title="Checkout" back={routes.customer.cart} />
      <CheckoutForm
        food={view.totals.food}
        deliveryFee={view.totals.deliveryFee}
        defaultAddress={last?.address ?? ''}
      />
    </div>
  );
}
