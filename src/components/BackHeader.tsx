import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

export function BackHeader({ title, right, to }: { title: string; right?: ReactNode; to?: string }) {
  const nav = useNavigate();
  return (
    <header className="mb-4 flex items-center gap-2">
      <button onClick={() => (to ? nav(to) : nav(-1))} aria-label="뒤로"
        className="card-3d-press flex h-10 w-10 items-center justify-center"><Icon name="back" size={20} /></button>
      <h1 className="flex-1 truncate text-lg font-extrabold">{title}</h1>
      {right}
    </header>
  );
}
