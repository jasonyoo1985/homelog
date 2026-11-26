import type { ReactNode } from 'react';

export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="card-3d flex flex-col items-center gap-3 px-6 py-10 text-center anim-fade">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-grad-primary text-3xl shadow-float" aria-hidden>🏠</div>
      <h3 className="text-base font-bold">{title}</h3>
      {desc && <p className="text-sm text-ink-sub">{desc}</p>}
      {action}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex justify-center py-16" role="status" aria-label="불러오는 중">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-100 border-t-primary" />
    </div>
  );
}
