import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { MATERIAL_CATEGORIES, type MaterialItem } from '@/db/types';
import { createStandardTemplate, STANDARD_TEMPLATE } from '@/db/template';
import { ensureHouse } from '@/db/repo';
import { dueInfo, dueLabel } from '@/lib/dates';
import { STATUS_CLASS, STATUS_LABEL } from '@/lib/status';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Loading } from '@/components/EmptyState';
import { PhotoImg } from '@/components/Photo';
import { Icon } from '@/components/Icon';
import { useToast } from '@/components/Toast';
import { inputCls } from '@/components/Field';

type StatusFilter = 'all' | 'need' | 'UNKNOWN' | 'PARTIAL' | 'VERIFIED' | 'due';
const STATUS_CHIPS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'need', label: '확인 필요' },
  { key: 'UNKNOWN', label: '미확인' },
  { key: 'PARTIAL', label: '일부확인' },
  { key: 'VERIFIED', label: '확인완료' },
  { key: 'due', label: '교체 임박' },
];

function matchStatus(m: MaterialItem, f: StatusFilter): boolean {
  if (f === 'all') return true;
  if (f === 'need') return m.status !== 'VERIFIED';
  if (f === 'due') { const s = dueInfo(m.lastMaintainedDate, m.maintenanceCycleMonths).state; return s === 'overdue' || s === 'soon'; }
  return m.status === f;
}

export function Materials() {
  const nav = useNavigate();
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const status = (sp.get('status') as StatusFilter) || 'all';
  const room = sp.get('room') || '';

  const items = useLiveQuery(() => db.materials.orderBy('createdAt').toArray(), []);
  const house = useLiveQuery(() => db.houses.toCollection().first(), []);

  const setParam = (k: string, v: string) => {
    const n = new URLSearchParams(sp);
    if (v && v !== 'all') n.set(k, v); else n.delete(k);
    setSp(n, { replace: true });
  };

  const rooms = useMemo(() => {
    const set = new Set<string>(house?.rooms ?? []);
    items?.forEach((m) => set.add(m.roomName));
    return [...set];
  }, [house, items]);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (items ?? []).filter((m) =>
      matchStatus(m, status) && (!room || m.roomName === room) && (!category || m.category === category) &&
      (!k || [m.name, m.brand, m.modelName, m.roomName, m.spec].some((v) => v?.toLowerCase().includes(k))));
  }, [items, status, room, category, q]);

  if (!items || !house) return <Loading />;

  async function makeTemplate() {
    const h = await ensureHouse();
    const n = await createStandardTemplate(h.id);
    toast.show(n ? `표준 자재 ${n}종을 만들었어요` : '이미 자재가 있어요', n ? 'ok' : 'info');
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="자재관리" sub="집 안의 모든 자재와 제품을 체계적으로 기록하세요" />
        <EmptyState title="아직 등록된 자재가 없어요" desc={`한국 아파트 표준 자재 ${STANDARD_TEMPLATE.length}종을 '미확인' 상태로 만들어 두고, 카드를 눌러 아는 것만 채우면 돼요.`}
          action={
            <div className="mt-2 flex w-full flex-col gap-2">
              <button className="btn-3d w-full" onClick={makeTemplate}>표준 자재 {STANDARD_TEMPLATE.length}종 한 번에 만들기</button>
              <button className="btn-soft w-full" onClick={() => nav('/materials/new')}>직접 하나씩 등록하기</button>
            </div>} />
      </>
    );
  }

  const need = items.filter((m) => m.status !== 'VERIFIED').length;
  return (
    <>
      <PageHeader title="자재관리" sub={`전체 ${items.length}개 · 확인 필요 ${need}개`} />
      <div className="relative mb-3">
        <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-sub" />
        <input className={`${inputCls} !pl-11`} placeholder="자재명, 제조사, 모델명 검색" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="상태 필터">
        {STATUS_CHIPS.map((c) => (
          <button key={c.key} className={`chip shrink-0 ${status === c.key ? 'chip-on' : ''}`} onClick={() => setParam('status', c.key)}>{c.label}</button>
        ))}
      </div>
      <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="공간 필터">
        {['', ...rooms].map((r) => (
          <button key={r || 'all'} className={`chip shrink-0 ${room === r ? 'chip-on' : ''}`} onClick={() => setParam('room', r)}>{r || '모든 공간'}</button>
        ))}
      </div>
      <select className={`${inputCls} mb-4`} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="카테고리">
        <option value="">모든 카테고리</option>
        {MATERIAL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>

      {filtered.length === 0 ? (
        <EmptyState title="조건에 맞는 자재가 없어요" desc="필터나 검색어를 바꿔 보세요." />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((m) => {
            const due = dueInfo(m.lastMaintainedDate, m.maintenanceCycleMonths);
            return (
              <li key={m.id}>
                <Link to={`/materials/${m.id}`} className="card-3d-press flex items-center gap-3 p-3">
                  {m.photos[0]
                    ? <PhotoImg photo={m.photos[0]} className="h-16 w-16 shrink-0 rounded-2xl" />
                    : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-2xl" aria-hidden>📦</div>}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold">{m.name}</div>
                    <div className="truncate text-xs text-ink-sub">{[m.roomName, m.brand, m.modelName].filter(Boolean).join(' · ')}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className={`badge ${STATUS_CLASS[m.status]}`}>{STATUS_LABEL[m.status]}</span>
                      {(due.state === 'overdue' || due.state === 'soon') && <span className="badge badge-warn">{dueLabel(due)}</span>}
                    </div>
                  </div>
                  <Icon name="chevron" size={18} className="shrink-0 text-ink-sub" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="pointer-events-none fixed inset-x-0 z-30 mx-auto max-w-[480px] px-4" style={{ bottom: 'calc(92px + var(--safe-bottom))' }}>
        <button className="btn-3d pointer-events-auto w-full" onClick={() => nav('/materials/new')}>+ 자재 등록하기</button>
      </div>
    </>
  );
}
