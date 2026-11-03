import { MapPinIcon } from '@phosphor-icons/react/dist/ssr';
import { PageHeader } from '@/components/shop/page-header';
import { getCustomer } from '@/lib/customer';
import { routes } from '@/lib/routes';

export default async function AddressesPage() {
  const { supabase } = await getCustomer(routes.customer.addresses);
  const { data: addresses } = await supabase
    .from('customer_addresses')
    .select('id, label, address')
    .order('created_at', { ascending: false });
  return (
    <div className="px-6 pt-12">
      <PageHeader title="Saved addresses" back={routes.customer.account} />
      {addresses?.length ? (
        <ul className="mt-6 divide-y divide-line">
          {addresses.map((a) => (
            <li key={a.id} className="flex items-center gap-4 py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-peach text-brand">
                <MapPinIcon weight="bold" className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold">{a.label}</p>
                <p className="text-muted">{a.address}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-[22px] bg-card p-5 text-muted">
          Addresses you deliver to are saved here after your first order.
        </p>
      )}
    </div>
  );
}
