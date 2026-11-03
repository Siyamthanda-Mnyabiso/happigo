'use client';

import { useEffect, useState } from 'react';
import { formatCountdown, secondsLeft } from '@/lib/orders';

export function Countdown({ deadline }: { deadline: string | null }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const left = now === null ? null : secondsLeft(deadline, now);
  return (
    <span className="text-xl font-extrabold text-brand tabular-nums" aria-live="off">
      {left === null ? '--:--' : formatCountdown(left)}
    </span>
  );
}
