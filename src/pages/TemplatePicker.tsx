import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { ensureHouse } from '@/db/repo';
import { STANDARD_TEMPLATE, addTemplateItems } from '@/db/template';
import { BackHeader } from '@/components/BackHeader';
import { useToast } from '@/components/Toast';

export function TemplatePicker() {
  const nav = useNavigate();
  const toast = useToast();
  const existing = useLiveQuery(() => db.materials.toArray(), []);
  const [off, setOff] = useState<Set<number>>(new Set());
  const have = useMemo(() => new Set((existing ?? []).map((m) => `${m.roomName}|${m.name}`)), [existing]);

  const groups = useMemo(() => {
    const g = new Map<string, { i: number; name: string; dup: boolean }[]>();
    STANDARD_TEMPLATE.forEach((t, i) => {
      const arr = g.get(t.room) ?? [];
      arr.push({ i, name: t.name, dup: have.has(`${t.room}|${t.name}`) });
      g.set(t.room, arr);
    });
    return [...g.entries()];
  }, [have]);

  const selected = STANDARD_TEMPLATE.map((_, i) => i).filter((i) => !off.has(i) && !have.has(`${STANDARD_TEMPLATE[i].room}|${STANDARD_TEMPLATE[i].name}`));
  const toggle = (i: number) => setOff((p) => { const n = new Set(p); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  const allOn = () => setOff(new Set());
  const allOff = () => setOff(new Set(STANDARD_TEMPLATE.map((_, i) => i)));

  async function create() {
    if (!selected.length) return;
    const h = await ensureHouse();
    const n = await addTemplateItems(h.id, selected);
    toast.show(`${n}개를 만들었어요. 카드를 눌러 아는 것만 채워 보세요`);
    nav('/materials', { replace: true });
  }

  return (
    <>
      <BackHeader title="표준 자재 고르기" />
      <section className="card-3d mb-4 p-4">
        <h2 className="text-[15px] font-bold">이게 뭔가요?</h2>
        <p className="mt-1 break-keep text-[13px] leading-relaxed text-ink-sub">
          한국 아파트에 흔히 있는 자재·설비 목록이에요. 체크한 항목마다 <b>이름만 적힌 빈 카드</b>가 만들어지고, 제조사·모델명 같은 정보는 아는 만큼만 나중에 채우면 돼요.
          우리 집에 없는 건 <b>체크를 해제</b>하세요. 만든 뒤에도 언제든 지울 수 있어요.
        </p>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-bg p-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-xl" aria-hidden>📦</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">거실 마루</div>
            <div className="text-xs text-ink-sub">거실</div>
            <span className="badge badge-danger mt-1">미확인</span>
          </div>
          <span className="text-[11px] text-ink-sub">만들어지는 카드 예시</span>
        </div>
      </section>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">{selected.length}개 선택됨</div>
        <div className="flex gap-2"><button className="chip" onClick={allOn}>전체 선택</button><button className="chip" onClick={allOff}>전체 해제</button></div>
      </div>

      <div className="flex flex-col gap-3">
        {groups.map(([room, items]) => (
          <section key={room} className="card-3d p-4">
            <h3 className="mb-2 text-sm font-bold">{room}</h3>
            <ul className="flex flex-col">
              {items.map((it) => {
                const checked = !off.has(it.i) && !it.dup;
                return (
                  <li key={it.i}>
                    <label className={`flex items-center gap-3 border-b border-line py-2.5 last:border-0 ${it.dup ? 'opacity-50' : ''}`}>
                      <input type="checkbox" className="h-5 w-5 accent-[#2878ED]" checked={checked} disabled={it.dup} onChange={() => toggle(it.i)} />
                      <span className="flex-1 text-[15px]">{it.name}</span>
                      {it.dup && <span className="text-xs text-ink-sub">이미 있어요</span>}
                      {STANDARD_TEMPLATE[it.i].cycle && !it.dup && <span className="text-[11px] text-ink-sub">{STANDARD_TEMPLATE[it.i].cycle}개월 주기 참고</span>}
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-3 px-1 text-xs text-ink-sub">교체 주기는 일반적인 참고값이에요. 실제 제품의 권장 주기는 설명서를 확인해 주세요.</p>

      <div className="fixed inset-x-0 z-30 mx-auto max-w-[480px] px-4" style={{ bottom: 'calc(92px + var(--safe-bottom))' }}>
        <button className="btn-3d w-full disabled:opacity-50" disabled={!selected.length} onClick={create}>{selected.length ? `선택한 ${selected.length}개 만들기` : '만들 항목을 선택해 주세요'}</button>
      </div>
      <div className="h-28" />
    </>
  );
}
