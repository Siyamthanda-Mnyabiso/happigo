import { clsx } from 'clsx';
import type { Tone } from '@/lib/admin-format';

const text: Record<Tone, string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  neutral: 'text-muted',
};
const dot: Record<Tone, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn-dot',
  danger: 'bg-danger',
  neutral: 'bg-muted',
};

/** A status as a coloured dot and plain text. No pill, so it reads as a label, not a button. */
export function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center gap-2 font-semibold', text[tone])}>
      <span className={clsx('size-2 shrink-0 rounded-full', dot[tone])} aria-hidden />
      {children}
    </span>
  );
}
