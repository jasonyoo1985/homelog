import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { QuickAddSheet } from './QuickAddSheet';

export function Layout() {
  const [sheet, setSheet] = useState(false);
  return (
    <div className="mx-auto min-h-full max-w-[480px] bg-bg">
      <main className="px-4" style={{ paddingTop: 'calc(16px + var(--safe-top))', paddingBottom: 'calc(112px + var(--safe-bottom))' }}>
        <Outlet />
      </main>
      <BottomNav onQuickAdd={() => setSheet(true)} />
      <QuickAddSheet open={sheet} onClose={() => setSheet(false)} />
    </div>
  );
}
