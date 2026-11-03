import { redirect } from 'next/navigation';
import { getCustomer } from '@/lib/customer';
import { loadCartView } from '@/lib/cart-view';
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
    <>
      <h1 className="text-3xl font-extrabold">Checkout</h1>
      <p className="mb-6 text-muted">{view.restaurant.name}</p>
      <CheckoutForm
        food={view.totals.food}
        deliveryFee={view.totals.deliveryFee}
        defaultAddress={last?.address ?? ''}
      />
    </>
  );
}
