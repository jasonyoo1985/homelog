import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FIRST_STEPS, MENU_ROLES } from '@/data/guide';
import { useBackClose } from '@/lib/useBackClose';

const KEY = 'homelog.onboarded';
export const isOnboarded = (): boolean => { try { return localStorage.getItem(KEY) === '1'; } catch { return true; } };
export const markOnboarded = (): void => { try { localStorage.setItem(KEY, '1'); } catch { /* 무시 */ } };

const Tile = ({ children, tone = 'from-[#8DBBFF] to-[#2878ED]' }: { children: string; tone?: string }) => (
  <span className={`flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br ${tone} text-[40px] shadow-float`} aria-hidden>{children}</span>
);

export function Onboarding({ onDone }: { onDone: () => void }) {
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const total = 4;
  const finish = (to?: string) => { markOnboarded(); onDone(); if (to) nav(to); };
  useBackClose(true, () => (i > 0 ? setI(i - 1) : finish()));

  return (
    <div className="fixed inset-0 z-[80] mx-auto flex max-w-[480px] flex-col bg-bg" role="dialog" aria-modal="true" aria-label="처음 사용 안내"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
      <div className="flex justify-end px-4 pt-4">
        <button className="px-3 py-2 text-sm font-semibold text-ink-sub" onClick={() => finish()}>건너뛰기</button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-4 pt-2 anim-fade" key={i}>
        {i === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Tile>🏠</Tile>
            <h1 className="mt-6 text-[26px] font-extrabold leading-tight">우리 집의 모든 기록을<br />한곳에 남겨요</h1>
            <p className="mt-3 break-keep text-[15px] leading-relaxed text-ink-sub">
              자재와 설비 정보, 수리 이력, 보증서와 영수증까지.<br />
              "이거 뭐였더라?" 할 때 홈로그에서 바로 찾아보세요.
            </p>
            <p className="mt-5 rounded-2xl bg-primary-100 px-4 py-3 text-[13px] font-medium text-primary">모든 기록은 이 폰 안에만 저장되고, 서버로 보내지 않아요.</p>
          </div>
        )}
        {i === 1 && (
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="text-center text-[24px] font-extrabold">이렇게 시작해 보세요</h1>
            <p className="mt-2 text-center text-sm text-ink-sub">전부 한 번에 하지 않아도 괜찮아요.</p>
            <ol className="mt-6 flex flex-col gap-4">
              {FIRST_STEPS.map((s) => (
                <li key={s.n} className="card-3d flex gap-4 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-grad-primary text-lg font-extrabold text-white shadow-card-press">{s.n}</span>
                  <div><div className="font-bold">{s.title}</div><p className="mt-1 break-keep text-[13px] leading-relaxed text-ink-sub">{s.desc}</p></div>
                </li>
              ))}
            </ol>
          </div>
        )}
        {i === 2 && (
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="text-center text-[24px] font-extrabold">메뉴는 이런 곳이에요</h1>
            <ul className="mt-5 flex flex-col gap-3">
              {MENU_ROLES.map((m) => (
                <li key={m.title} className="card-3d flex gap-3 p-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-2xl" aria-hidden>{m.emoji}</span>
                  <div className="min-w-0"><div className="font-bold">{m.title}</div><p className="break-keep text-[13px] leading-relaxed text-ink-sub">{m.role}</p></div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {i === 3 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Tile tone="from-[#7BE0BC] to-[#20B486]">✅</Tile>
            <h1 className="mt-6 text-[24px] font-extrabold">준비됐어요!</h1>
            <p className="mt-3 break-keep text-[15px] leading-relaxed text-ink-sub">어디서부터 시작할까요?<br />언제든 홈의 '이용 가이드'에서 다시 볼 수 있어요.</p>
            <div className="mt-6 flex w-full flex-col gap-3">
              <button className="btn-3d" onClick={() => finish('/materials/template')}>표준 자재 목록 보고 시작하기</button>
              <button className="btn-soft" onClick={() => finish('/materials/new')}>직접 하나씩 등록할래요</button>
              <button className="py-2 text-sm font-semibold text-ink-sub" onClick={() => finish()}>먼저 둘러볼게요</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-6 pb-6 pt-2">
        <div className="flex gap-2" aria-hidden>{Array.from({ length: total }).map((_, k) => (
          <span key={k} className={`h-2 rounded-full transition-all ${k === i ? 'w-6 bg-primary' : 'w-2 bg-line'}`} />))}</div>
        {i < total - 1 && <button className="btn-3d !px-8 !py-2.5" onClick={() => setI(i + 1)}>다음</button>}
      </div>
    </div>
  );
}
