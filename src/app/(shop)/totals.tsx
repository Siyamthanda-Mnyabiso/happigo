import { formatRand } from '@/lib/money';

/** Food, delivery, tip, total. Same breakdown in the cart, at checkout and on the receipt. */
export function Totals({
  food,
  deliveryFee,
  tip = 0,
  showTotal = true,
}: {
  food: number;
  deliveryFee: number;
  tip?: number;
  showTotal?: boolean;
}) {
  const rows: [string, number][] = [
    ['Food', food],
    ['Delivery fee', deliveryFee],
    ...(tip ? ([['Tip for your driver', tip]] as [string, number][]) : []),
  ];
  return (
    <dl className="space-y-3">
      {rows.map(([label, cents]) => (
        <div key={label} className="flex justify-between">
          <dt className="text-muted">{label}</dt>
          <dd className="font-medium">{formatRand(cents)}</dd>
        </div>
      ))}
      {showTotal && (
        <div className="flex justify-between border-t border-line pt-4 text-xl font-bold">
          <dt>Total</dt>
          <dd>{formatRand(food + deliveryFee + tip)}</dd>
        </div>
      )}
    </dl>
  );
}
