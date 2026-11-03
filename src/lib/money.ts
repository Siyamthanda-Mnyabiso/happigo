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
