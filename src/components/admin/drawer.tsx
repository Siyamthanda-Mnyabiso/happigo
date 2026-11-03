'use client';

import { XIcon } from '@phosphor-icons/react/dist/ssr';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/** A side panel over the list. Esc, the dark area and the close button all return to the list. */
export function Drawer({
  title,
  closeHref,
  width,
  children,
}: {
  title: string;
  closeHref: string;
  width: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push(closeHref);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [router, closeHref]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={() => router.push(closeHref)}
        className="absolute inset-0 bg-overlay"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ maxWidth: width }}
        className="relative flex h-full w-full flex-col overflow-y-auto bg-white"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-8 py-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            ref={close}
            type="button"
            aria-label="Close"
            onClick={() => router.push(closeHref)}
            className="flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-card focus-visible:outline-2 focus-visible:outline-brand"
          >
            <XIcon weight="bold" className="size-5" aria-hidden />
          </button>
        </header>
        <div className="flex-1 px-8 py-6">{children}</div>
      </aside>
    </div>
  );
}

export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 border-b border-line py-3 last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}
