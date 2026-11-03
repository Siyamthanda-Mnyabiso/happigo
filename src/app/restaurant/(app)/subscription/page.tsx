import { createClient } from '@/lib/supabase/server';
import { PLANS, type PlanId } from '@/lib/plans';
import { LinkButton } from '@/components/ui/button';

const fmt = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, next_billing_on, restaurant_id')
    .single();
  const { data: payments } = await supabase
    .from('subscription_payments')
    .select('id, paid_on, status')
    .order('paid_on', { ascending: false })
    .limit(6);
  const plan = PLANS[(sub?.plan ?? 'smb') as PlanId];

  return (
    <>
      <h1 className="mb-4 text-xl font-bold">Subscription</h1>
      <section className="rounded-3xl bg-ink p-6 text-white">
        <p className="text-[#e6dcd4]">Current plan</p>
        <p className="text-3xl font-extrabold">{plan.name}</p>
        <p className="mt-3 text-[#e6dcd4]">
          {sub?.next_billing_on
            ? `Next bill on ${fmt.format(new Date(sub.next_billing_on))}`
            : 'Billing starts soon'}
        </p>
        <p className="font-medium text-[#e6dcd4]">No commission on any order</p>
      </section>
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
        <LinkButton href="/restaurant/onboarding/plan">Change plan</LinkButton>
      </div>
    </>
  );
}
