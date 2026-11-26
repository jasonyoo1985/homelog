import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { uid } from '@/db/repo';
import { compareQuotes, manWon, nextStage, STAGE_LABEL, STAGE_ORDER } from '@/lib/repair';
import { today } from '@/lib/dates';
import { BackHeader } from '@/components/BackHeader';
import { PhotoImg } from '@/components/Photo';
import { EmptyState, Loading } from '@/components/EmptyState';
import { TextInput } from '@/components/Field';
import { useToast } from '@/components/Toast';

export function RepairDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const r = useLiveQuery(async () => (await db.repairs.get(id)) ?? null, [id]);
  const material = useLiveQuery(async () => (r?.materialId ? ((await db.materials.get(r.materialId)) ?? null) : null), [r?.materialId]);
  const [vendor, setVendor] = useState(''); const [amount, setAmount] = useState('');

  if (r === undefined) return <Loading />;
  if (!r) return (<><BackHeader title="수리 기록" to="/repairs" /><EmptyState title="기록을 찾을 수 없어요" /></>);
  const cmp = compareQuotes(r.quotes ?? []);
  const next = nextStage(r.stage);

  async function advance() {
    if (!next) return;
    await db.repairs.update(r!.id, { stage: next, repairedDate: next === 'DONE' ? (r!.repairedDate || today()) : r!.repairedDate, updatedAt: Date.now() });
    toast.show(`'${STAGE_LABEL[next]}' 단계로 바꿨어요`);
  }
  async function addQuote() {
    const a = Number(amount);
    if (!vendor.trim() || !(a > 0)) { toast.show('업체명과 금액을 입력해 주세요', 'info'); return; }
    await db.repairs.update(r!.id, { quotes: [...(r!.quotes ?? []), { id: uid(), vendor: vendor.trim(), amount: Math.round(a) }], updatedAt: Date.now() });
    setVendor(''); setAmount('');
  }
  async function removeQuote(qid: string) { await db.repairs.update(r!.id, { quotes: (r!.quotes ?? []).filter((q) => q.id !== qid), updatedAt: Date.now() }); }
  async function adopt(qid: string) {
    const q = (r!.quotes ?? []).find((x) => x.id === qid); if (!q) return;
    await db.repairs.update(r!.id, { providerName: q.vendor, cost: q.amount, updatedAt: Date.now() });
    toast.show('이 견적으로 업체와 비용을 채웠어요');
  }
  async function removeRecord() {
    if (!window.confirm(`「${r!.title}」 기록을 지울까요? 되돌릴 수 없어요.`)) return;
    await db.repairs.delete(r!.id); toast.show('지웠어요', 'info'); nav('/repairs', { replace: true });
  }

  return (
    <>
      <BackHeader title={r.title} to="/repairs" right={<Link to={`/repairs/${r.id}/edit`} className="btn-soft !px-4 !py-2 text-sm">수정</Link>} />
      <div className="flex flex-col gap-4">
        {r.photos.length > 0 && <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">{r.photos.map((p) => <PhotoImg key={p.id} photo={p} full className="h-44 w-44 shrink-0 rounded-3xl shadow-card" />)}</div>}
        <section className="card-3d p-4">
          <div className="mb-3 flex items-center gap-1.5">
            {STAGE_ORDER.map((s, i) => (
              <div key={s} className={`flex-1 rounded-full py-1.5 text-center text-xs font-bold ${STAGE_ORDER.indexOf(r.stage) >= i ? 'bg-grad-primary text-white shadow-card-press' : 'bg-bg text-ink-sub'}`}>{STAGE_LABEL[s]}</div>
            ))}
          </div>
          {next && <button className="btn-3d w-full" onClick={advance}>'{STAGE_LABEL[next]}'(으)로 바꾸기</button>}
          <div className="mt-3 text-sm">
            {[['위치', r.roomName], ['문제 유형', r.issueType], ['발생일', r.occurredDate], ['완료일', r.repairedDate], ['업체', r.providerName], ['비용', r.cost ? manWon(r.cost) : undefined]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0"><span className="text-ink-sub">{k}</span><span className="font-medium">{v || '-'}</span></div>))}
          </div>
          {r.beforeAfterNotes && <p className="mt-2 whitespace-pre-wrap break-words rounded-2xl bg-bg p-3 text-sm">{r.beforeAfterNotes}</p>}
        </section>
        {material && (
          <Link to={`/materials/${material.id}`} className="card-3d-press flex items-center justify-between p-4">
            <span><span className="text-xs text-ink-sub">연결된 자재</span><span className="block font-bold">{material.name}</span></span><span className="text-primary">자재 보기 ›</span>
          </Link>)}
        <section className="card-3d p-4">
          <h2 className="mb-1 text-sm font-bold">견적 비교</h2>
          <p className="mb-3 text-xs text-ink-sub">업체별 견적을 직접 입력해 비교해 보세요. 앱이 가격을 대신 알려 주지는 않아요.</p>
          {(r.quotes ?? []).length > 0 && (
            <ul className="mb-3 flex flex-col gap-2">
              {(r.quotes ?? []).map((q) => (
                <li key={q.id} className={`flex items-center gap-2 rounded-2xl border p-3 ${q.id === cmp.lowestId ? 'border-ok bg-ok-bg' : 'border-line'}`}>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{q.vendor}{q.id === cmp.lowestId && <span className="ml-1.5 text-xs text-ok">최저가</span>}</div><div className="text-sm">{manWon(q.amount)}</div></div>
                  <button className="chip" onClick={() => adopt(q.id)}>이걸로 정할게요</button>
                  <button aria-label="견적 지우기" className="px-2 text-ink-sub" onClick={() => removeQuote(q.id)}>✕</button>
                </li>))}
              {cmp.saving ? <li className="px-1 text-xs text-ink-sub">가장 비싼 견적보다 {manWon(cmp.saving)} 저렴해요</li> : null}
            </ul>)}
          <div className="flex gap-2">
            <TextInput placeholder="업체명" value={vendor} onChange={(e) => setVendor(e.target.value)} />
            <TextInput placeholder="금액(원)" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} />
            <button className="btn-soft shrink-0 !px-4" onClick={addQuote}>추가</button>
          </div>
        </section>
        <button className="py-3 text-sm font-semibold text-danger" onClick={removeRecord}>이 기록 지우기</button>
      </div>
    </>
  );
}
