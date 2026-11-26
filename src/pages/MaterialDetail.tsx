import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { deriveStatus, STATUS_CLASS, STATUS_LABEL } from '@/lib/status';
import { dueInfo, dueLabel, today } from '@/lib/dates';
import { googleImageUrl, googleLensUrl, googleUrl, inquiryText, naverUrl, searchQuery } from '@/lib/search';
import { BackHeader } from '@/components/BackHeader';
import { PhotoImg } from '@/components/Photo';
import { Loading, EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { inputCls } from '@/components/Field';

function Row({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0">
      <span className="shrink-0 text-ink-sub">{k}</span>
      <span className={`text-right font-medium ${v ? '' : 'text-ink-sub/60'}`}>{v || '미확인'}</span>
    </div>
  );
}

export function MaterialDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const m = useLiveQuery(async () => (await db.materials.get(id)) ?? null, [id]);
  const house = useLiveQuery(() => db.houses.toCollection().first(), []);
  const [notes, setNotes] = useState<string | null>(null);

  if (m === undefined || !house) return <Loading />;
  if (!m) return (<><BackHeader title="자재" to="/materials" /><EmptyState title="자재를 찾을 수 없어요" /></>);

  const q = searchQuery(m);
  const due = dueInfo(m.lastMaintainedDate, m.maintenanceCycleMonths);

  async function done() {
    const next = { lastMaintainedDate: today(), updatedAt: Date.now() };
    await db.materials.update(m!.id, next);
    toast.show('오늘 교체·점검 완료로 기록했어요');
  }
  async function copyInquiry() {
    const text = inquiryText(m!, house!.name);
    try { await navigator.clipboard.writeText(text); toast.show('문의 문구를 복사했어요'); }
    catch { toast.show('복사하지 못했어요. 길게 눌러 직접 복사해 주세요', 'error'); }
  }
  async function saveNotes() {
    if (notes === null || notes === (m!.discoveryNotes ?? '')) return;
    await db.materials.update(m!.id, { discoveryNotes: notes, updatedAt: Date.now() });
    toast.show('탐색 메모를 저장했어요');
  }
  async function remove() {
    if (!window.confirm(`「${m!.name}」을(를) 삭제할까요? 되돌릴 수 없어요.`)) return;
    await db.materials.delete(m!.id);
    toast.show('삭제했어요', 'info');
    nav('/materials', { replace: true });
  }
  const status = deriveStatus(m);
  const link = 'btn-soft text-center text-sm !px-3 !py-2.5';

  return (
    <>
      <BackHeader title={m.name} to="/materials" right={<Link to={`/materials/${m.id}/edit`} className="btn-soft !px-4 !py-2 text-sm">수정</Link>} />
      <div className="flex flex-col gap-4">
        {m.photos.length > 0 && (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {m.photos.map((p) => <PhotoImg key={p.id} photo={p} full className="h-44 w-44 shrink-0 rounded-3xl shadow-card" />)}
          </div>
        )}
        <section className="card-3d p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className={`badge ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
            <span className="text-xs text-ink-sub">{m.roomName} · {m.category}</span>
          </div>
          <Row k="제조사/브랜드" v={m.brand} /><Row k="모델명/품번" v={m.modelName} /><Row k="규격/색상" v={m.spec} />
          <Row k="설치일" v={m.installedDate} /><Row k="보증 만료일" v={m.warrantyEndDate} />
          <Row k="A/S·고객센터 메모" v={m.customerCenter} /><Row k="구매처 메모" v={m.purchaseUrlOrNote} />
        </section>

        {m.maintenanceCycleMonths && (
          <section className="card-3d p-4">
            <h2 className="mb-1 text-sm font-bold">교체·점검 주기 {m.maintenanceCycleMonths}개월</h2>
            <p className={`mb-3 text-sm ${due.state === 'overdue' ? 'font-semibold text-danger' : due.state === 'soon' ? 'font-semibold text-warn' : 'text-ink-sub'}`}>
              {dueLabel(due)}{due.nextDate && due.state !== 'ok' ? ` (${due.nextDate})` : ''}
            </p>
            <button className="btn-3d w-full" onClick={done}>✓ 오늘 교체·점검 완료</button>
          </section>
        )}

        <section className="card-3d p-4">
          <h2 className="mb-1 text-sm font-bold">모르는 자재 찾기</h2>
          <p className="mb-3 text-xs text-ink-sub">검색어: <b>{q}</b> · 검색 결과는 참고용이니 실제 제품과 꼭 대조해 주세요.</p>
          <div className="grid grid-cols-2 gap-2">
            <a className={link} href={naverUrl(q)} target="_blank" rel="noopener noreferrer">네이버 검색</a>
            <a className={link} href={googleUrl(q)} target="_blank" rel="noopener noreferrer">구글 검색</a>
            <a className={link} href={googleImageUrl(q)} target="_blank" rel="noopener noreferrer">구글 이미지</a>
            <a className={link} href={googleLensUrl} target="_blank" rel="noopener noreferrer">구글 렌즈</a>
          </div>
          <button className="btn-soft mt-2 w-full text-sm !py-2.5" onClick={copyInquiry}>관리사무소·시공사 문의 문구 복사</button>
          <label className="mt-3 block text-[13px] font-semibold text-ink-sub">탐색 메모 (문의 기관·일자·회신)</label>
          <textarea className={`${inputCls} mt-1.5 min-h-24`} value={notes ?? m.discoveryNotes ?? ''} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes}
            placeholder="예) 11/26 관리사무소 문의 → 12/1 회신 예정" />
        </section>

        <button className="py-3 text-sm font-semibold text-danger" onClick={remove}>이 자재 삭제</button>
      </div>
    </>
  );
}
