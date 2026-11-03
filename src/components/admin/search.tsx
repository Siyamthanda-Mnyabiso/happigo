import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr';

/** A plain GET form. Hidden fields keep the current tab when searching. */
export function SearchBox({
  label,
  q,
  hidden = {},
}: {
  label: string;
  q: string;
  hidden?: Record<string, string>;
}) {
  return (
    <form role="search" className="relative w-full max-w-sm">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label htmlFor="admin-search" className="sr-only">
        {label}
      </label>
      <MagnifyingGlassIcon
        weight="bold"
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        id="admin-search"
        name="q"
        defaultValue={q}
        placeholder={label}
        className="h-12 w-full rounded-xl border border-line bg-white pl-12 pr-4 text-base placeholder:text-muted focus-visible:outline-2 focus-visible:outline-brand"
      />
    </form>
  );
}
