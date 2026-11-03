import { PageHead } from '@/components/admin/page-head';
import { cell, cellRight, DataTable } from '@/components/admin/table';
import { getAdmin } from '@/lib/admin';
import { dateLabel } from '@/lib/admin-format';
import { formatRand } from '@/lib/money';

export const metadata = { title: 'Customers | HappiGo admin' };
export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const { supabase } = await getAdmin();
  const { data } = await supabase.rpc('admin_customers');
  const rows = data ?? [];
  return (
    <>
      <PageHead title="Customers" note="Showing the 500 newest" />
      <DataTable
        caption="Customers"
        heads={[
          { label: 'Customer' },
          { label: 'Orders', right: true },
          { label: 'Spent on food', right: true },
          { label: 'Last order' },
          { label: 'Joined' },
        ]}
        isEmpty={rows.length === 0}
        empty="No customers yet"
      >
        {rows.map((c) => (
          <tr key={c.id}>
            <td className={cell}>
              <p className="font-semibold">{c.name ?? 'No name'}</p>
              <p className="text-muted">{c.email ?? 'No email'}</p>
            </td>
            <td className={cellRight}>{c.orders}</td>
            <td className={cellRight}>{formatRand(c.spent_cents)}</td>
            <td className={cell}>{dateLabel(c.last_order)}</td>
            <td className={cell}>{dateLabel(c.joined)}</td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
