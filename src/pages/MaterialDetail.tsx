import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { uid } from '@/db/repo';
import { deriveStatus } from '@/lib/status';
import { dueInfo, dueLabel, today } from '@/lib/dates';
import { googleImageUrl, googleLensUrl, googleUrl, inquiryText, naverUrl, searchQuery } from '@/lib/search';
import { manWon, STAGE_CLASS, STAGE_LABEL, won } from '@/lib/repair';
import { BackHeader } from '@/components/BackHeader';
import { PhotoImg, useObjectUrl } from '@/components/Photo';
import { compressFiles, MAX_PHOTOS } from '@/components/PhotoPicker';
import { Loading, EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { inputCls } from '@/components/Field';
import { useBackClose } from '@/lib/useBackClose';
import type { StoredPhoto } from '@/db/types';

/** 메모에서 전화번호를 찾아 누르면 바로 걸 수 있게 한다 */
export function findPhones(text?: string): string[] {
  const found = text?.match(/\+?\d{2,4}[-\s]?\d{3,4}[-\s]?\d{3,4}|\d{4}[-\s]?\d{4}/g) ?? [];
  return [...new Set(found.map((x) => x.trim()))];
}

function Viewer({ photos, start, onClose, onRemove }: { photos: StoredPhoto[]; start: number; onClose: () => void; onRemove: (id: string) => void }) {
  const [i, setI] = useState(Math.min(start, photos.length - 1));
  const p = photos[i];
  const url = useObjectUrl(p?.blob);
  useBackClose(true, onClose);
  if (!p) return null;
  return (
    <div className="fixed inset-0 z-[75] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="사진 보기">
      <div className="flex items-center justify-between px-4 pb-2 pt-4 text-white" style={{ paddingTop: 'calc(16px + var(--safe-top))' }}>
        <span className="text-sm">{i + 1} / {photos.length}</span>
        <div className="flex gap-4">
          <button className="text-sm text-white/80" onClick={() => { if (window.confirm('이 사진을 지울까요?')) { onRemove(p.id); if (photos.length <= 1) onClose(); else setI(Math.max(0, i - 1)); } }}>지우기</button>
          <button className="text-sm font-bold" onClick={onClose}>닫기</button>
        </div>
      </div>
      {/* pinch-zoom: 시리얼 번호 같은 작은 글자를 확대해서 볼 수 있게 */}
      <div className="flex flex-1 items-center justify-center overflow-auto" style={{ touchAction: 'pinch-zoom pan-x pan-y' }} data-noswipe>
        {url && <img src={url} alt="" className="max-h-full max-w-full object-contain" />}
      </div>
      {photos.length > 1 && (
        <div className="flex justify-between px-6 pb-6 text-3xl text-white" style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
          <button aria-label="이전 사진" disabled={i === 0} className="disabled:opacity-30" onClick={() => setI(i - 1)}>‹</button>
          <button aria-label="다음 사진" disabled={i === photos.length - 1} className="disabled:opacity-30" onClick={() => setI(i + 1)}>›</button>
        </div>)}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0">
      <span className="shrink-0 text-ink-sub">{k}</span>
      <span className="break-words text-right font-medium">{v}</span>
    </div>
  );
}

export function MaterialDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const m = useLiveQuery(async () => (await db.materials.get(id)) ?? null, [id]);
  const house = useLiveQuery(() => db.houses.toCollection().first(), []);
  const repairs = useLiveQuery(() => db.repairs.where('materialId').equals(id).toArray(), [id]);
  const [notes, setNotes] = useState<string | null>(null);
  const [view, setView] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const camRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);

  if (m === undefined || !house) return <Loading />;
  if (!m) return (<><BackHeader title="자재" to="/materials" /><EmptyState title="자재를 찾을 수 없어요" /></>);

  const q = searchQuery(m);
  const cycleOk = !!m.maintenanceCycleMonths && m.maintenanceCycleMonths <= 600;
  const due = dueInfo(m.lastMaintainedDate, cycleOk ? m.maintenanceCycleMonths : undefined);
  const phones = findPhones(m.customerCenter);
  const rows = ([
    ['제조사/브랜드', m.brand], ['모델명/품번', m.modelName], ['규격/색상', m.spec], ['설치일', m.installedDate],
    ['보증 만료일', m.warrantyEndDate], ['구입가', m.purchasePrice ? won(m.purchasePrice) : undefined], ['구매처', m.purchaseUrlOrNote],
  ] as [string, string | undefined][]).filter((r): r is [string, string] => !!r[1]);
  const link = 'btn-soft text-center text-sm !px-3 !py-2.5';

  async function savePhotos(photos: StoredPhoto[]) {
    await db.materials.update(m!.id, { photos, status: deriveStatus({ ...m!, photos }), updatedAt: Date.now() });
  }
  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_PHOTOS - m!.photos.length;
    if (room <= 0) { toast.show(`사진은 최대 ${MAX_PHOTOS}장까지 저장할 수 있어요`, 'info'); return; }
    setBusy(true);
    try {
      const added = await compressFiles(Array.from(files).slice(0, room), 'label');
      await savePhotos([...m!.photos, ...added]);
      toast.show(`사진 ${added.length}장을 약 ${Math.max(1, Math.round(added.reduce((a, p) => a + p.blob.size, 0) / 1024))}KB로 줄여 저장했어요`);
    } catch { toast.show('사진을 저장하지 못했어요', 'error'); }
    finally { setBusy(false); if (camRef.current) camRef.current.value = ''; if (albumRef.current) albumRef.current.value = ''; }
  }
  async function done() {
    await db.materials.update(m!.id, { lastMaintainedDate: today(), updatedAt: Date.now() });
    toast.show('오늘 교체·점검 완료로 기록했어요');
  }
  async function copyInquiry() {
    try { await navigator.clipboard.writeText(inquiryText(m!, house!.name)); toast.show('문의 문구를 복사했어요'); }
    catch { toast.show('복사하지 못했어요. 길게 눌러 직접 복사해 주세요', 'error'); }
  }
  async function saveNotes() {
    if (notes === null || notes === (m!.discoveryNotes ?? '')) return;
    await db.materials.update(m!.id, { discoveryNotes: notes, updatedAt: Date.now() });
    toast.show('메모를 저장했어요');
  }
  async function duplicate() {
    const now = Date.now();
    const copy = { ...m!, id: uid(), name: `${m!.name} (복사)`, photos: [], lastMaintainedDate: undefined, createdAt: now, updatedAt: now };
    await db.materials.add(copy);
    toast.show('복사했어요. 달라진 부분만 고쳐 주세요');
    nav(`/materials/${copy.id}/edit`);
  }
  async function removeItem() {
    if (!window.confirm(`「${m!.name}」을(를) 지울까요? 되돌릴 수 없어요.`)) return;
    await db.materials.delete(m!.id);
    toast.show('지웠어요', 'info');
    nav('/materials', { replace: true });
  }

  return (
    <>
      <BackHeader title={m.name} to="/materials" right={<Link to={`/materials/${m.id}/edit`} className="btn-soft !px-4 !py-2 text-sm">수정</Link>} />
      <div className="flex flex-col gap-4">
        <p className="-mt-2 px-1 text-xs text-ink-sub">{m.roomName} · {m.category}</p>

        {/* 문제가 생겼을 때 가장 먼저 필요한 것: 어디에 연락할지 */}
        {m.customerCenter && (
          <section className="card-3d p-4">
            <h2 className="mb-1 text-sm font-bold">A/S·문의처</h2>
            <p className="whitespace-pre-wrap break-words text-[15px]">{m.customerCenter}</p>
            {phones.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {phones.map((ph) => <a key={ph} href={`tel:${ph.replace(/\s/g, '')}`} className="btn-3d !px-4 !py-2 text-sm">📞 {ph} 전화</a>)}
              </div>)}
          </section>)}

        {/* 사진: 제품 라벨·시리얼 번호를 찍어 두는 용도 */}
        <section className="card-3d p-4">
          <h2 className="mb-1 text-sm font-bold">사진 {m.photos.length > 0 && <span className="font-normal text-ink-sub">· {m.photos.length}장</span>}</h2>
          {m.photos.length === 0 && <p className="mb-2 text-xs text-ink-sub">제품 라벨이나 시리얼 번호를 사진으로 남겨 두면, 일일이 적지 않아도 나중에 확인할 수 있어요.</p>}
          {m.photos.length > 0 && (
            <div className="-mx-1 mb-2 flex gap-3 overflow-x-auto px-1 pb-1">
              {m.photos.map((p, i) => (
                <button key={p.id} type="button" aria-label={`사진 ${i + 1} 크게 보기`} onClick={() => setView(i)} className="shrink-0">
                  <PhotoImg photo={p} className="h-28 w-28 rounded-2xl shadow-card-press" />
                </button>))}
            </div>)}
          <div className="flex gap-2">
            <button disabled={busy} className="btn-soft flex-1 !py-2.5 text-sm disabled:opacity-60" onClick={() => camRef.current?.click()}>{busy ? '줄이는 중…' : '📷 촬영'}</button>
            <button disabled={busy} className="btn-soft flex-1 !py-2.5 text-sm disabled:opacity-60" onClick={() => albumRef.current?.click()}>🖼️ 앨범에서</button>
          </div>
          <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => addPhotos(e.target.files)} />
          <input ref={albumRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
        </section>

        {rows.length > 0 && (
          <section className="card-3d p-4">{rows.map(([k, v]) => <Row key={k} k={k} v={v} />)}</section>)}
        {m.discoveryNotes && (
          <section className="card-3d p-4">
            <h2 className="mb-1 text-sm font-bold">메모</h2>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-sub">{m.discoveryNotes}</p>
          </section>)}
        {rows.length === 0 && !m.customerCenter && !m.discoveryNotes && (
          <p className="rounded-2xl bg-white/70 px-4 py-3 text-center text-sm text-ink-sub">기록한 정보가 아직 없어요. 사진만 남겨도 충분하고, 필요하면 <Link to={`/materials/${m.id}/edit`} className="font-semibold text-primary">수정</Link>에서 적어 두세요.</p>)}

        {cycleOk && (
          <section className="card-3d p-4">
            <h2 className="mb-1 text-sm font-bold">교체·점검 주기 {m.maintenanceCycleMonths}개월</h2>
            {due.state !== 'noRecord' && <p className={`mb-3 text-sm ${due.state === 'overdue' ? 'font-semibold text-danger' : due.state === 'soon' ? 'font-semibold text-warn' : 'text-ink-sub'}`}>
              {dueLabel(due)}{due.nextDate && due.state !== 'ok' ? ` (${due.nextDate})` : ''}</p>}
            {m.lastMaintainedDate && <p className="mb-3 text-xs text-ink-sub">마지막 교체·점검: {m.lastMaintainedDate}</p>}
            <button className="btn-3d w-full" onClick={done}>✓ 오늘 교체·점검 완료</button>
          </section>)}

        {(repairs ?? []).length > 0 && (
          <section className="card-3d p-4">
            <h2 className="mb-2 text-sm font-bold">수리 이력</h2>
            <ul className="flex flex-col gap-2">{[...(repairs ?? [])].sort((a, b) => b.occurredDate.localeCompare(a.occurredDate)).map((r) => (
              <li key={r.id}><Link to={`/repairs/${r.id}`} className="flex items-center justify-between gap-2 rounded-2xl bg-bg p-3">
                <span className="min-w-0 truncate text-sm font-semibold">{r.title}<span className="ml-2 text-xs font-normal text-ink-sub">{r.occurredDate}</span></span>
                <span className="flex shrink-0 items-center gap-2">{r.cost ? <span className="text-xs">{manWon(r.cost)}</span> : null}<span className={`badge ${STAGE_CLASS[r.stage]}`}>{STAGE_LABEL[r.stage]}</span></span>
              </Link></li>))}</ul>
          </section>)}

        <div className="grid grid-cols-2 gap-2">
          <Link to={`/repairs/new?materialId=${m.id}`} className={link}>🛠️ 수리·하자 기록</Link>
          <button className={link} onClick={duplicate}>복사해서 새로 만들기</button>
        </div>

        <details className="card-3d p-4">
          <summary className="cursor-pointer text-sm font-bold">정보를 더 찾아보고 싶다면 (검색·문의 문구·메모)</summary>
          <p className="mb-3 mt-2 text-xs text-ink-sub">검색어: <b>{q}</b> · 검색 결과는 참고용이니 실제 제품과 꼭 대조해 주세요.</p>
          <div className="grid grid-cols-2 gap-2">
            <a className={link} href={naverUrl(q)} target="_blank" rel="noopener noreferrer">네이버 검색</a>
            <a className={link} href={googleUrl(q)} target="_blank" rel="noopener noreferrer">구글 검색</a>
            <a className={link} href={googleImageUrl(q)} target="_blank" rel="noopener noreferrer">구글 이미지</a>
            <a className={link} href={googleLensUrl} target="_blank" rel="noopener noreferrer">구글 렌즈</a>
          </div>
          <button className="btn-soft mt-2 w-full text-sm !py-2.5" onClick={copyInquiry}>관리사무소·시공사 문의 문구 복사</button>
          <label className="mt-3 block text-[13px] font-semibold text-ink-sub">메모 쓰기·고치기 (문의 기관·일자·회신 등)</label>
          <textarea className={`${inputCls} mt-1.5 min-h-24`} value={notes ?? m.discoveryNotes ?? ''} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} />
        </details>

        <button className="py-3 text-sm font-semibold text-danger" onClick={removeItem}>이 자재 지우기</button>
      </div>
      {view !== null && <Viewer photos={m.photos} start={view} onClose={() => setView(null)} onRemove={(pid) => void savePhotos(m.photos.filter((x) => x.id !== pid))} />}
    </>
  );
}
