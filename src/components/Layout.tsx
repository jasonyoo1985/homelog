import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { BottomNav } from './BottomNav';
import { QuickAddSheet } from './QuickAddSheet';
import { WhatsNewSheet } from './WhatsNewSheet';
import { Onboarding, isOnboarded } from './Onboarding';
import { useToast } from './Toast';
import { LATEST, RELEASES, type Release } from '@/data/releases';
import { planAppUpdate, runAppUpdate, type UpdatePlan } from '@/lib/appUpdate';
import { decideWhatsNew, getSeen, getSeenBuild, isReturningUser, markSeen, sinceBuild } from '@/lib/whatsnew';
import { decideBack, popBack, TAB_ROUTES } from '@/lib/back';
import { useKeyboardOpen } from '@/lib/useKeyboardOpen';

const SWIPE_DISTANCE = 70;

export function Layout() {
  const loc = useLocation();
  const nav = useNavigate();
  const toast = useToast();
  const kb = useKeyboardOpen();
  const [sheet, setSheet] = useState(false);
  const [notes, setNotes] = useState<Release | null>(null);
  const [intro, setIntro] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const prevPath = useRef(loc.pathname);
  const [dir, setDir] = useState<'l' | 'r' | null>(null);

  // ── 업데이트 후 안내: 마지막으로 본 빌드 이후에 바뀐 내용을 모아서 보여준다 ──
  useEffect(() => {
    const since = sinceBuild(getSeen(), getSeenBuild(), RELEASES);
    const d = decideWhatsNew(since, isReturningUser(), RELEASES, __APP_BUILD__);
    if (d.kind === 'silent') {
      markSeen(LATEST.id, __APP_BUILD__);
      if (!isOnboarded()) setIntro(true); // 처음 설치한 사용자에게는 업데이트 안내 대신 소개 화면
    } else if (d.kind === 'show') setNotes(d.notes);
  }, []);
  const closeNotes = () => { markSeen(LATEST.id, __APP_BUILD__); setNotes(null); };

  // ── 새 버전 확인: 앱을 열 때 구글 플레이에 새 버전이 있으면 '무엇이 바뀌는지' 먼저 보여주고 묻는다 ──
  const [update, setUpdate] = useState<UpdatePlan | null>(null);
  useEffect(() => {
    let alive = true;
    void planAppUpdate(__APP_BUILD__).then((p) => { if (alive && p) setUpdate(p); });
    return () => { alive = false; };
  }, []);
  const generic: Release = { id: 'generic', build: __APP_BUILD__, title: '새 버전이 나왔어요', subtitle: '더 좋아진 홈로그를 받아 보세요. 지금 업데이트할까요?', items: [] };
  const confirmUpdate = () => {
    const p = update; setUpdate(null);
    if (p) void runAppUpdate(p.action); // 즉시 방식: 설치 후 앱이 다시 열리고, 그때 '새로 바뀐 점'이 나온다
  };

  // ── 탭 이동 방향 애니메이션 (탭 버튼·스와이프 공통) ──
  useEffect(() => {
    const a = TAB_ROUTES.indexOf(prevPath.current);
    const b = TAB_ROUTES.indexOf(loc.pathname);
    setDir(a >= 0 && b >= 0 && a !== b ? (b > a ? 'l' : 'r') : null);
    prevPath.current = loc.pathname;
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  // ── 하드웨어 뒤로가기: 앱 안에서 처리 ──
  const latest = useRef({ path: loc.pathname, nav, toast });
  latest.current = { path: loc.pathname, nav, toast };
  const lastBackAt = useRef(0);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const h = CapApp.addListener('backButton', () => {
      if (popBack()) return; // 열려 있는 시트/팝업 먼저 닫기
      const { path, nav: go, toast: t } = latest.current;
      const canGoBack = ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0;
      const now = Date.now();
      const act = decideBack(path, canGoBack, lastBackAt.current, now);
      if (act.type === 'navigate') go(act.to as string);
      else if (act.type === 'exit') void CapApp.exitApp();
      else { lastBackAt.current = now; t.show('한 번 더 누르면 앱이 종료돼요', 'info'); }
    });
    return () => { void h.then((x) => x.remove()); };
  }, []);

  // ── 좌우 스와이프로 탭 이동 ──
  const touch = useRef<{ x: number; y: number; mode: 'h' | 'v' | null; skip: boolean } | null>(null);
  const idx = TAB_ROUTES.indexOf(loc.pathname);
  const swipeable = idx >= 0 && !sheet && !notes && !intro;

  function onStart(e: TouchEvent) {
    if (!swipeable) return;
    const t = e.touches[0];
    const el = e.target as HTMLElement;
    touch.current = { x: t.clientX, y: t.clientY, mode: null, skip: !!el.closest('.overflow-x-auto,[data-noswipe],input,textarea,select') };
  }
  function onMove(e: TouchEvent) {
    const s = touch.current; if (!s || s.skip) return;
    const t = e.touches[0]; const dx = t.clientX - s.x; const dy = t.clientY - s.y;
    if (!s.mode && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) s.mode = Math.abs(dx) > Math.abs(dy) * 1.4 ? 'h' : 'v';
    if (s.mode !== 'h' || !wrap.current) return;
    const blocked = (dx > 0 && idx === 0) || (dx < 0 && idx === TAB_ROUTES.length - 1);
    const shift = blocked ? dx * 0.15 : dx * 0.55;
    wrap.current.style.transition = 'none';
    wrap.current.style.transform = `translateX(${shift}px)`;
    wrap.current.style.opacity = String(1 - Math.min(Math.abs(shift) / 400, 0.4));
  }
  function onEnd(e: TouchEvent) {
    const s = touch.current; touch.current = null;
    const el = wrap.current; if (!s || !el) return;
    const dx = e.changedTouches[0].clientX - s.x;
    const target = dx < 0 ? idx + 1 : idx - 1;
    if (s.mode === 'h' && Math.abs(dx) > SWIPE_DISTANCE && target >= 0 && target < TAB_ROUTES.length) {
      nav(TAB_ROUTES[target]);
      return;
    }
    el.style.transition = 'transform .2s ease, opacity .2s ease';
    el.style.transform = ''; el.style.opacity = '';
  }

  const anim = dir === 'l' ? 'anim-slide-l' : dir === 'r' ? 'anim-slide-r' : 'anim-fade';
  return (
    <div className="mx-auto min-h-full max-w-[480px] bg-bg">
      <main className="px-4" style={{ paddingTop: 'calc(16px + var(--safe-top))', paddingBottom: kb ? '24px' : 'calc(112px + var(--safe-bottom))', touchAction: swipeable ? 'pan-y' : undefined }}
        onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} onTouchCancel={onEnd}>
        <div ref={wrap} key={loc.pathname} className={anim} style={{ minHeight: '60vh' }}>
          <Outlet />
        </div>
      </main>
      {!kb && <BottomNav onQuickAdd={() => setSheet(true)} />}
      <QuickAddSheet open={sheet} onClose={() => setSheet(false)} />
      {update && <WhatsNewSheet mode="update" release={update.release ?? generic} onClose={() => setUpdate(null)} onConfirm={confirmUpdate} />}
      {!update && notes && <WhatsNewSheet release={notes} onClose={closeNotes} />}
      {intro && <Onboarding onDone={() => setIntro(false)} />}
    </div>
  );
}
