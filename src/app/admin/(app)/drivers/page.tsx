import { Chip } from '@/components/admin/chip';
import { ConfirmAction } from '@/components/admin/confirm-action';
import { PageHead } from '@/components/admin/page-head';
import { cell, cellRight, DataTable } from '@/components/admin/table';
import { getAdmin } from '@/lib/admin';
import { DRIVER_STATUS } from '@/lib/admin-format';
import { formatRand } from '@/lib/money';
import { setDriverSuspended } from '../actions';

export const metadata = { title: 'Drivers | HappiGo admin' };
export const dynamic = 'force-dynamic';

export default async function DriversPage() {
  const { supabase } = await getAdmin();
  const { data } = await supabase.rpc('admin_drivers');
  const rows = data ?? [];
  return (
    <>
      <PageHead title="Drivers" note="Everyone who delivers for HappiGo" />
      <DataTable
        caption="Drivers"
        heads={[
          { label: 'Driver' },
          { label: 'Vehicle' },
          { label: 'Status' },
          { label: 'Deliveries this month', right: true },
          { label: 'Earned this month', right: true },
          { label: 'Account' },
        ]}
        isEmpty={rows.length === 0}
        empty="No drivers have joined yet"
      >
        {rows.map((d) => {
          const s = DRIVER_STATUS[d.status];
          const name = d.name ?? 'Unnamed driver';
          return (
            <tr key={d.id}>
              <td className={cell}>
                <p className="font-semibold">{name}</p>
                <p className="text-muted">{d.phone ?? 'No phone'}</p>
              </td>
              <td className={cell}>{d.vehicle ?? 'Not added'}</td>
              <td className={cell}>
                <Chip tone={s.tone}>{s.label}</Chip>
              </td>
              <td className={cellRight}>{d.deliveries_this_month}</td>
              <td className={cellRight}>{formatRand(d.earned_this_month_cents)}</td>
              <td className={cell}>
                {d.status === 'suspended' ? (
                  <ConfirmAction
                    action={setDriverSuspended.bind(null, d.id, false)}
                    label="Reinstate"
                  />
                ) : (
                  <ConfirmAction
                    danger
                    action={setDriverSuspended.bind(null, d.id, true)}
                    label="Suspend"
                    confirm={`Suspend ${name}? They go offline and cannot take deliveries.`}
                    confirmLabel="Yes, suspend"
                  />
                )}
              </td>
            </tr>
          );
        })}
      </DataTable>
    </>
  );
}
