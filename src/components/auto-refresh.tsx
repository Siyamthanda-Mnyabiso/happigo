'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** New orders arrive while the screen is open, so re-fetch every few seconds (and when the tab regains focus). */
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => document.visibilityState === 'visible' && router.refresh();
    const id = setInterval(tick, seconds * 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [router, seconds]);
  return null;
}
