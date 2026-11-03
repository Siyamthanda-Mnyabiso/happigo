/** All money is stored as integer cents (ZAR). */
export type Cents = number;

/** 184000 -> "R1 840". Whole rands shown without decimals, otherwise two decimals. */
export function formatRand(cents: Cents): string {
  const rands = cents / 100;
  const whole = Number.isInteger(rands);
  const [int, dec] = rands.toFixed(whole ? 0 : 2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `R${grouped}${dec ? `.${dec}` : ''}`;
}

/** "15" or "15.50" or "R1 200,50" -> cents. Returns null for anything that isn't a money amount. */
export function parseRand(input: string): Cents | null {
  const cleaned = input.replace(/[R\s\u00a0]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

/** 1550 -> "15.50", for putting an existing price back into a form field. */
export function toRandInput(cents: Cents): string {
  return (cents / 100).toFixed(2);
}
