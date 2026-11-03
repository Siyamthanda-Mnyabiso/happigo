import { formatRand } from '@/lib/money';

/** Food, delivery, tip, total. Shown identically in the cart, at checkout and on the receipt. */
export function Totals({
  food,
  deliveryFee,
  tip = 0,
}: {
  food: number;
  deliveryFee: number;
  tip?: number;
}) {
  const rows: [string, number][] = [
    ['Food', food],
    ['Delivery fee', deliveryFee],
    ...(tip ? ([['Tip for your driver', tip]] as [string, number][]) : []),
  ];
  return (
    <dl className="space-y-2">
      {rows.map(([label, cents]) => (
        <div key={label} className="flex justify-between">
          <dt className="text-muted">{label}</dt>
          <dd>{formatRand(cents)}</dd>
        </div>
      ))}
      <div className="flex justify-between border-t border-line pt-3 text-lg font-bold">
        <dt>Total</dt>
        <dd>{formatRand(food + deliveryFee + tip)}</dd>
      </div>
      <p className="text-muted">No service fee. No hidden charges.</p>
    </dl>
  );
}
