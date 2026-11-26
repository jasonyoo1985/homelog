import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { QuickAddSheet } from './QuickAddSheet';
import { WhatsNewSheet } from './WhatsNewSheet';
import { LATEST } from '@/data/releases';
import { getSeen, isReturningUser, markSeen, shouldShowRelease } from '@/lib/whatsnew';

export function Layout() {
  const [sheet, setSheet] = useState(false);
  const [notes, setNotes] = useState(false);
  useEffect(() => {
    (async () => {
      const r = shouldShowRelease(getSeen(), LATEST.id, isReturningUser());
      if (r === 'silent') markSeen(LATEST.id);
      if (r === 'show') setNotes(true);
    })();
  }, []);
  const closeNotes = () => { markSeen(LATEST.id); setNotes(false); };
  return (
    <div className="mx-auto min-h-full max-w-[480px] bg-bg">
      <main className="px-4" style={{ paddingTop: 'calc(16px + var(--safe-top))', paddingBottom: 'calc(112px + var(--safe-bottom))' }}>
        <Outlet />
      </main>
      <BottomNav onQuickAdd={() => setSheet(true)} />
      <QuickAddSheet open={sheet} onClose={() => setSheet(false)} />
      {notes && <WhatsNewSheet release={LATEST} onClose={closeNotes} />}
    </div>
  );
}
