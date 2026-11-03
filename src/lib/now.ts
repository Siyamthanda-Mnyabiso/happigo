/** The current time, as an explicit input. Server pages call this once and pass it down, so
 * time-dependent labels ("2 min ago") are computed from one consistent value. */
export function currentTime(): number {
  return Date.now();
}
