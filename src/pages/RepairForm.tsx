import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { ensureHouse, uid } from '@/db/repo';
import type { IssueType, RepairRecord, RepairStage, StoredPhoto } from '@/db/types';
import { ISSUE_TYPES, STAGE_LABEL, STAGE_ORDER } from '@/lib/repair';
import { today } from '@/lib/dates';
import { BackHeader } from '@/components/BackHeader';
import { EmptyState, Loading } from '@/components/EmptyState';
import { Field, TextInput, inputCls } from '@/components/Field';
import { PhotoPicker } from '@/components/PhotoPicker';
import { useToast } from '@/components/Toast';

export function RepairForm() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const house = useLiveQuery(() => db.houses.toCollection().first(), []);
  const materials = useLiveQuery(() => db.materials.toArray(), []);
  const existing = useLiveQuery(async () => (id ? ((await db.repairs.get(id)) ?? null) : undefined), [id]);

  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [issue, setIssue] = useState<IssueType>('작동불량');
  const [stage, setStage] = useState<RepairStage>('FOUND');
  const [occurred, setOccurred] = useState(today());
  const [repaired, setRepaired] = useState('');
  const [provider, setProvider] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const mid = sp.get('materialId');
    if (mid && materials && !id) {
      const m = materials.find((x) => x.id === mid);
      if (m) { setMaterialId(m.id); setRoom(m.roomName); setTitle((t) => t || `${m.name} 문제`); }
    }
  }, [sp, materials, id]);
  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title); setRoom(existing.roomName); setMaterialId(existing.materialId ?? ''); setIssue(existing.issueType); setStage(existing.stage);
    setOccurred(existing.occurredDate); setRepaired(existing.repairedDate ?? ''); setProvider(existing.providerName ?? '');
    setCost(existing.cost ? String(existing.cost) : ''); setNotes(existing.beforeAfterNotes ?? ''); setPhotos(existing.photos);
  }, [existing]);

  if (!house || !materials || (id && existing === undefined)) return <Loading />;
  if (id && existing === null) return (<><BackHeader title="수리 기록" to="/repairs" /><EmptyState title="기록을 찾을 수 없어요" /></>);
  const valid = title.trim() && room.trim();

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const h = await ensureHouse(); const now = Date.now();
      const rep = stage === 'DONE' ? (repaired || today()) : (repaired || undefined);
      const base = {
        houseId: h.id, materialId: materialId || undefined, roomName: room.trim(), title: title.trim(), issueType: issue, stage,
        occurredDate: occurred || today(), repairedDate: rep, providerName: provider.trim() || undefined,
        cost: Number(cost) > 0 ? Math.round(Number(cost)) : undefined, beforeAfterNotes: notes.trim() || undefined, photos,
      };
      let target = id;
      if (existing) await db.repairs.update(existing.id, { ...base, updatedAt: now });
      else { const r: RepairRecord = { ...base, id: uid(), createdAt: now, updatedAt: now }; await db.repairs.add(r); target = r.id; }
      toast.show('저장했어요');
      nav(`/repairs/${target}`, { replace: true });
    } catch { toast.show('저장하지 못했어요', 'error'); setSaving(false); }
  }

  return (
    <>
      <BackHeader title={existing ? '수리 기록 수정' : '수리·하자 기록'} />
      <div className="flex flex-col gap-4">
        <section><h2 className="mb-2 text-sm font-bold">사진 <span className="font-normal text-ink-sub">· 문제 부위를 찍어 두세요</span></h2>
          <PhotoPicker photos={photos} onChange={setPhotos} /></section>
        <div className="card-3d flex flex-col gap-4 p-4">
          <Field label="무슨 문제인가요?" required><TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 욕실 천장 누수" /></Field>
          <Field label="위치" required>
            <select className={inputCls} value={room} onChange={(e) => setRoom(e.target.value)}>
              <option value="" disabled>공간 선택</option>
              {[...new Set([...house.rooms, room].filter(Boolean))].map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="관련 자재 (선택)" hint="연결해 두면 자재 상세에서 수리 이력을 함께 볼 수 있어요.">
            <select className={inputCls} value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
              <option value="">연결 안 함</option>
              {materials.filter((m) => !room || m.roomName === room).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="문제 유형">
            <div className="flex flex-wrap gap-2">{ISSUE_TYPES.map((t) => (
              <button key={t} type="button" className={`chip ${issue === t ? 'chip-on' : ''}`} onClick={() => setIssue(t)}>{t}</button>))}</div>
          </Field>
          <Field label="진행 상태">
            <div className="flex gap-2">{STAGE_ORDER.map((s) => (
              <button key={s} type="button" className={`chip flex-1 justify-center ${stage === s ? 'chip-on' : ''}`} onClick={() => setStage(s)}>{STAGE_LABEL[s]}</button>))}</div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="발생일"><TextInput type="date" value={occurred} onChange={(e) => setOccurred(e.target.value)} /></Field>
            <Field label="수리 완료일"><TextInput type="date" value={repaired} onChange={(e) => setRepaired(e.target.value)} /></Field>
          </div>
          <Field label="업체명 / 자가수리"><TextInput value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="예) 자가수리, ○○설비" /></Field>
          <Field label="수리 비용 (원)"><TextInput inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value.replace(/\D/g, ''))} placeholder="0" /></Field>
          <Field label="메모 (전후 상태, 원인 등)"><textarea className={`${inputCls} min-h-24`} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </div>
        <button className="btn-3d disabled:opacity-50" disabled={!valid || saving} onClick={save}>{saving ? '저장 중…' : '저장하기'}</button>
        {!valid && <p className="-mt-2 text-center text-xs text-ink-sub">문제 제목과 위치만 입력하면 저장할 수 있어요.</p>}
      </div>
    </>
  );
}
