import { LinkButton } from '@/components/ui/button';
import { Card } from '@/components/ui/layout';
import { PLANS } from '@/lib/plans';
import { getPartner } from '@/lib/restaurant';
import { routes } from '@/lib/routes';

const fmt = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

export default async function SubscriptionPage() {
  const { supabase, restaurant } = await getPartner();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, next_billing_on')
    .eq('restaurant_id', restaurant!.id)
    .single();
  const { data: payments } = await supabase
    .from('subscription_payments')
    .select('id, paid_on, status')
    .eq('restaurant_id', restaurant!.id)
    .order('paid_on', { ascending: false })
    .limit(6);
  const plan = PLANS[sub?.plan ?? 'smb'];

  return (
    <>
      <h1 className="mb-4 text-xl font-bold">Subscription</h1>
      <Card tone="dark">
        <p className="text-on-dark">Current plan</p>
        <p className="text-3xl font-extrabold">{plan.name}</p>
        <p className="mt-3 text-on-dark">
          {sub?.next_billing_on
            ? `Next bill on ${fmt.format(new Date(sub.next_billing_on))}`
            : 'Billing starts soon'}
        </p>
        <p className="font-medium text-on-dark">No commission on any order</p>
      </Card>
      <h2 className="mb-2 mt-6 text-lg font-bold">Payment history</h2>
      {!payments?.length ? (
        <p className="text-muted">No payments yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {payments.map((p) => (
            <li key={p.id} className="flex justify-between py-3">
              <span className="font-medium">{fmt.format(new Date(p.paid_on))}</span>
              <span className="font-semibold capitalize">{p.status}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        <LinkButton href={routes.restaurant.planOnboarding}>Change plan</LinkButton>
      </div>
    </>
  );
}
