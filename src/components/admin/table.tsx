import { clsx } from 'clsx';

/** A flat bordered card holding a table. Scrolls sideways on narrow screens instead of squashing. */
export function DataTable({
  caption,
  heads,
  children,
  empty,
  isEmpty,
}: {
  caption: string;
  heads: readonly { label: string; right?: boolean }[];
  children: React.ReactNode;
  empty: string;
  isEmpty: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full min-w-[720px] border-collapse text-left text-base">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            {heads.map((h) => (
              <th
                key={h.label}
                scope="col"
                className={clsx('px-6 py-4 font-semibold text-muted', h.right && 'text-right')}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr:not(:last-child)]:border-b [&>tr]:border-line">{children}</tbody>
      </table>
      {isEmpty && <p className="px-6 py-10 text-center text-muted">{empty}</p>}
    </div>
  );
}

export const cell = 'px-6 py-4 align-middle';
export const cellRight = 'px-6 py-4 text-right align-middle';
