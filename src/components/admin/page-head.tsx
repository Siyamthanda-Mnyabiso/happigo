export function PageHead({ title, note }: { title: string; note?: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      {note && <p className="mt-1 text-muted">{note}</p>}
    </header>
  );
}
