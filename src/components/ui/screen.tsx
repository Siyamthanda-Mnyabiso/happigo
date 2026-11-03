export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 pb-8 pt-6">
      {children}
    </main>
  );
}

export function Field({
  label,
  name,
  error,
  ...props
}: { label: string; name: string; error?: string } & React.ComponentProps<'input'>) {
  const id = `f-${name}`;
  return (
    <div className="mb-5">
      <label htmlFor={id} className="mb-2 block text-base font-semibold">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className="h-14 w-full rounded-2xl bg-card px-4 text-base placeholder:text-muted focus-visible:outline-2 focus-visible:outline-brand"
        {...props}
      />
      {error && (
        <p id={`${id}-err`} className="mt-1 text-base text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
