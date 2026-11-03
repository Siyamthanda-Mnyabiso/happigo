import { Card } from '@/components/ui/layout';
import { getPartner } from '@/lib/restaurant';
import { formatRand } from '@/lib/money';

const LABEL: Record<string, string> = { new: 'New', preparing: 'Preparing', ready: 'Ready' };

export default async function OrdersPage() {
  const { supabase } = await getPartner();
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, food_cents, created_at')
    .in('status', ['new', 'preparing', 'ready'])
    .order('created_at', { ascending: false });

  return (
    <>
      <h1 className="mb-4 text-3xl font-extrabold">Orders</h1>
      {!orders?.length ? (
        <Card tone="fill" className="text-muted">
          No active orders. New orders show up here.
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Card>
                <div className="flex justify-between">
                  <span className="font-bold">#{o.id.slice(0, 6).toUpperCase()}</span>
                  <span className="font-semibold">{LABEL[o.status] ?? o.status}</span>
                </div>
                <p className="mt-1 text-muted">{formatRand(o.food_cents)} paid to your account</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
