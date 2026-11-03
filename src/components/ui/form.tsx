import { clsx } from 'clsx';

const control =
  'h-14 w-full rounded-2xl bg-card px-4 text-base placeholder:text-muted focus-visible:outline-2 focus-visible:outline-brand';

function Wrapper({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="mb-2 block text-base font-semibold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-base text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Field({
  label,
  name,
  error,
  className,
  ...props
}: { label: string; name: string; error?: string } & React.ComponentProps<'input'>) {
  const id = `f-${name}`;
  return (
    <Wrapper id={id} label={label} error={error}>
      <input
        id={id}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={clsx(control, className)}
        {...props}
      />
    </Wrapper>
  );
}

export function Select({
  label,
  name,
  error,
  className,
  children,
  ...props
}: { label: string; name: string; error?: string } & React.ComponentProps<'select'>) {
  const id = `f-${name}`;
  return (
    <Wrapper id={id} label={label} error={error}>
      <select
        id={id}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={clsx(control, className)}
        {...props}
      >
        {children}
      </select>
    </Wrapper>
  );
}
