import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/layout';
import { getCustomer } from '@/lib/customer';
import { routes } from '@/lib/routes';
import { signOut } from './actions';

export default async function AccountPage() {
  const { supabase, user, name } = await getCustomer(routes.customer.account);
  const { data: addresses } = await supabase
    .from('customer_addresses')
    .select('id, label, address')
    .order('created_at', { ascending: false });
  return (
    <>
      <h1 className="mb-1 text-3xl font-extrabold">{name}</h1>
      <p className="mb-6 text-muted">{user.email}</p>
      <Card className="mb-6">
        <h2 className="mb-2 font-bold">Saved addresses</h2>
        {addresses?.length ? (
          <ul className="space-y-2">
            {addresses.map((a) => (
              <li key={a.id}>
                <span className="font-semibold">{a.label}</span>
                <span className="block text-muted">{a.address}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">
            Addresses you deliver to are saved here after your first order.
          </p>
        )}
      </Card>
      <form action={signOut}>
        <Button type="submit" variant="secondary">
          Sign out
        </Button>
      </form>
    </>
  );
}
