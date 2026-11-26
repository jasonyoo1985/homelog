import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { RepairStage } from '@/db/types';
import { costTotals, manWon, STAGE_CLASS, STAGE_LABEL } from '@/lib/repair';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Loading } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';

const CHIPS: { key: 'all' | RepairStage; label: string }[] = [
  { key: 'all', label: '전체' }, { key: 'FOUND', label: '발견' }, { key: 'IN_PROGRESS', label: '진행중' }, { key: 'DONE', label: '완료' },
];

export function Repairs() {
  const nav = useNavigate();
  const repairs = useLiveQuery(() => db.repairs.toArray(), []);
  const [stage, setStage] = useState<'all' | RepairStage>('all');
  const list = useMemo(() => (repairs ?? []).filter((r) => stage === 'all' || r.stage === stage)
    .sort((a, b) => (b.occurredDate || '').localeCompare(a.occurredDate || '') || b.createdAt - a.createdAt), [repairs, stage]);

  if (!repairs) return <Loading />;
  const totals = costTotals(repairs, new Date().getFullYear());
  const open = repairs.filter((r) => r.stage !== 'DONE').length;

  return (
    <>
      <PageHeader title="수리이력" sub="고장·하자가 생겼을 때 발견부터 수리 완료까지 비용과 함께 남기는 곳" />
      {repairs.length === 0 ? (
        <EmptyState title="아직 수리 기록이 없어요" desc="누수, 파손, 작동 불량 같은 일이 생기면 여기에 남겨 두세요. 나중에 업체에 설명하거나 보증을 따질 때 큰 도움이 돼요."
          action={<button className="btn-3d mt-2 w-full" onClick={() => nav('/repairs/new')}>수리·하자 기록하기</button>} />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[['올해 수리비', manWon(totals.year)], ['누적 수리비', manWon(totals.all)], ['진행 중', `${open}건`]].map(([k, v]) => (
              <div key={k} className="card-3d p-3 text-center"><div className="text-[11px] text-ink-sub">{k}</div><div className="mt-1 text-base font-extrabold">{v}</div></div>
            ))}
          </div>
          <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {CHIPS.map((c) => <button key={c.key} className={`chip shrink-0 ${stage === c.key ? 'chip-on' : ''}`} onClick={() => setStage(c.key)}>{c.label}</button>)}
          </div>
          {list.length === 0 ? <EmptyState title="조건에 맞는 기록이 없어요" /> : (
            <ul className="flex flex-col gap-3">
              {list.map((r) => (
                <li key={r.id}>
                  <Link to={`/repairs/${r.id}`} className="card-3d-press flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-bold">{r.title}</div>
                      <div className="mt-0.5 truncate text-xs text-ink-sub">{[r.roomName, r.issueType, r.occurredDate].filter(Boolean).join(' · ')}</div>
                      <div className="mt-1.5 flex items-center gap-2"><span className={`badge ${STAGE_CLASS[r.stage]}`}>{STAGE_LABEL[r.stage]}</span>
                        {r.cost ? <span className="text-xs font-semibold">{manWon(r.cost)}</span> : null}</div>
                    </div>
                    <Icon name="chevron" size={18} className="shrink-0 text-ink-sub" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="pointer-events-none fixed inset-x-0 z-30 mx-auto max-w-[480px] px-4" style={{ bottom: 'calc(92px + var(--safe-bottom))' }}>
            <button className="btn-3d pointer-events-auto w-full" onClick={() => nav('/repairs/new')}>+ 수리·하자 기록하기</button>
          </div>
        </>
      )}
    </>
  );
}
