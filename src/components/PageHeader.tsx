export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mb-4">
      <h1 className="text-[22px] font-extrabold tracking-tight">{title}</h1>
      {sub && <p className="mt-1 text-sm text-ink-sub">{sub}</p>}
    </header>
  );
}
