import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { uid, ensureHouse } from '@/db/repo';
import { MATERIAL_CATEGORIES, type MaterialCategory, type MaterialItem, type StoredPhoto } from '@/db/types';
import { deriveStatus } from '@/lib/status';
import { BackHeader } from '@/components/BackHeader';
import { Field, TextInput, inputCls } from '@/components/Field';
import { PhotoPicker } from '@/components/PhotoPicker';
import { CatalogPicker } from '@/components/CatalogPicker';
import type { Prefill } from '@/lib/catalog';
import { EmptyState, Loading } from '@/components/EmptyState';
import { useToast } from '@/components/Toast';

interface Form {
  name: string; roomName: string; category: MaterialCategory; brand: string; modelName: string; spec: string;
  installedDate: string; warrantyEndDate: string; customerCenter: string; purchaseUrlOrNote: string;
  cycle: string; lastMaintainedDate: string; photos: StoredPhoto[]; price: string; note: string;
}
const empty: Form = { name: '', roomName: '', category: '기타', brand: '', modelName: '', spec: '', installedDate: '', warrantyEndDate: '',
  customerCenter: '', purchaseUrlOrNote: '', cycle: '', lastMaintainedDate: '', photos: [], price: '', note: '' };

export function MaterialForm() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const house = useLiveQuery(() => db.houses.toCollection().first(), []);
  const existing = useLiveQuery(async () => (id ? ((await db.materials.get(id)) ?? null) : undefined), [id]);
  const [f, setF] = useState<Form>({ ...empty, roomName: sp.get('room') ?? '' });
  const [more, setMore] = useState(false);
  const [customRoom, setCustomRoom] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setF({
      name: existing.name, roomName: existing.roomName, category: existing.category, brand: existing.brand ?? '', modelName: existing.modelName ?? '',
      spec: existing.spec ?? '', installedDate: existing.installedDate ?? '', warrantyEndDate: existing.warrantyEndDate ?? '',
      customerCenter: existing.customerCenter ?? '', purchaseUrlOrNote: existing.purchaseUrlOrNote ?? '',
      cycle: existing.maintenanceCycleMonths ? String(existing.maintenanceCycleMonths) : '', lastMaintainedDate: existing.lastMaintainedDate ?? '', photos: existing.photos,
      price: existing.purchasePrice ? String(existing.purchasePrice) : '', note: '',
    });
    setMore(true);
  }, [existing]);

  if (!house || (id && existing === undefined)) return <Loading />;
  if (id && existing === null) return (<><BackHeader title="자재 수정" to="/materials" /><EmptyState title="자재를 찾을 수 없어요" /></>);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const applyPrefill = (p: Prefill) => { setF((prev) => ({ ...prev, name: p.name, roomName: p.roomName, category: p.category, brand: p.brand, modelName: p.modelName, spec: p.spec, note: p.note })); setMore(true); };
  const rooms = house.rooms;
  const valid = f.name.trim() && f.roomName.trim();

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const h = await ensureHouse();
      const now = Date.now();
      const cycle = Math.min(Number(f.cycle), 600); // 비정상적으로 큰 값 방지
      const base = {
        houseId: h.id, roomName: f.roomName.trim(), category: f.category, name: f.name.trim(),
        brand: f.brand.trim() || undefined, modelName: f.modelName.trim() || undefined, spec: f.spec.trim() || undefined,
        installedDate: f.installedDate || undefined, warrantyEndDate: f.warrantyEndDate || undefined,
        customerCenter: f.customerCenter.trim() || undefined, purchaseUrlOrNote: f.purchaseUrlOrNote.trim() || undefined,
        purchasePrice: Number(f.price) > 0 ? Math.round(Number(f.price)) : undefined,
        ...(!existing && f.note ? { discoveryNotes: f.note } : {}),
        maintenanceCycleMonths: cycle > 0 ? Math.round(cycle) : undefined, lastMaintainedDate: f.lastMaintainedDate || undefined, photos: f.photos,
      };
      const status = deriveStatus(base);
      if (!h.rooms.includes(base.roomName)) await db.houses.update(h.id, { rooms: [...h.rooms, base.roomName], updatedAt: now });
      let target = id;
      if (existing) {
        await db.materials.update(existing.id, { ...base, status, updatedAt: now });
      } else {
        const item: MaterialItem = { ...base, id: uid(), status, createdAt: now, updatedAt: now };
        await db.materials.add(item);
        target = item.id;
      }
      toast.show('저장했어요');
      nav(`/materials/${target}`, { replace: true });
    } catch {
      toast.show('저장하지 못했어요. 저장 공간을 확인해 주세요', 'error');
      setSaving(false);
    }
  }

  return (
    <>
      <BackHeader title={existing ? '자재 수정' : '자재 등록'} />
      <div className="flex flex-col gap-4">
        {!existing && <CatalogPicker rooms={house.rooms} category={f.category} onCategory={(c) => set('category', c)} onPick={applyPrefill} onManual={() => document.getElementById('f-name')?.focus()} />}
        <section>
          <h2 className="mb-2 text-sm font-bold">사진 <span className="font-normal text-ink-sub">· 제품 라벨(모델명)을 함께 찍어두면 좋아요</span></h2>
          <PhotoPicker photos={f.photos} onChange={(p) => set('photos', p)} />
        </section>
        <div className="card-3d flex flex-col gap-4 p-4">
          <Field label="자재명" required><TextInput id="f-name" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="예) 거실 마루" /></Field>
          <Field label="공간" required>
            {customRoom ? (
              <TextInput value={f.roomName} onChange={(e) => set('roomName', e.target.value)} placeholder="공간 이름 입력" autoFocus />
            ) : (
              <select className={inputCls} value={f.roomName}
                onChange={(e) => (e.target.value === '__new' ? (setCustomRoom(true), set('roomName', '')) : set('roomName', e.target.value))}>
                <option value="" disabled>공간 선택</option>
                {[...new Set([...rooms, f.roomName].filter(Boolean))].map((r) => <option key={r}>{r}</option>)}
                <option value="__new">+ 직접 입력</option>
              </select>
            )}
          </Field>
          {existing && (<Field label="카테고리">
            <select className={inputCls} value={f.category} onChange={(e) => set('category', e.target.value as MaterialCategory)}>
              {MATERIAL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>)}
          <p className="text-xs text-ink-sub">모르는 정보는 비워두세요. 적은 정보만 저장돼요.</p>
        </div>

        <button type="button" className="btn-soft" onClick={() => setMore((v) => !v)}>{more ? '상세 정보 접기' : '아는 정보 더 입력하기 (선택)'}</button>
        {more && (
          <div className="card-3d flex flex-col gap-4 p-4 anim-fade">
            <Field label="제조사/브랜드"><TextInput value={f.brand} onChange={(e) => set('brand', e.target.value)} /></Field>
            <Field label="모델명/품번"><TextInput value={f.modelName} onChange={(e) => set('modelName', e.target.value)} /></Field>
            <Field label="규격/색상/재질"><TextInput value={f.spec} onChange={(e) => set('spec', e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="설치일"><TextInput type="date" value={f.installedDate} onChange={(e) => set('installedDate', e.target.value)} /></Field>
              <Field label="보증 만료일"><TextInput type="date" value={f.warrantyEndDate} onChange={(e) => set('warrantyEndDate', e.target.value)} /></Field>
            </div>
            <Field label="A/S·고객센터 메모" hint="직접 확인한 연락처만 적어 주세요."><TextInput value={f.customerCenter} onChange={(e) => set('customerCenter', e.target.value)} /></Field>
            <Field label="구매처/링크 메모"><TextInput value={f.purchaseUrlOrNote} onChange={(e) => set('purchaseUrlOrNote', e.target.value)} /></Field>
            <Field label="구입가·계약금액 (원)"><TextInput inputMode="numeric" value={f.price} onChange={(e) => set('price', e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="0" /></Field>
            <Field label="교체·점검 주기 (개월)" hint="필터·건전지처럼 주기가 있는 것만 적으면 돼요. 최대 600개월.">
              <div className="flex gap-2">
                {[3, 6, 12, 24].map((n) => (
                  <button key={n} type="button" className={`chip ${f.cycle === String(n) ? 'chip-on' : ''}`} onClick={() => set('cycle', f.cycle === String(n) ? '' : String(n))}>{n}개월</button>
                ))}
              </div>
              <TextInput className="mt-2" inputMode="numeric" value={f.cycle} onChange={(e) => set('cycle', e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="직접 입력" />
            </Field>
            <Field label="마지막 교체·점검일"><TextInput type="date" value={f.lastMaintainedDate} onChange={(e) => set('lastMaintainedDate', e.target.value)} /></Field>
          </div>
        )}
        <button className="btn-3d disabled:opacity-50" disabled={!valid || saving} onClick={save}>{saving ? '저장 중…' : '저장하기'}</button>
        {!valid && <p className="-mt-2 text-center text-xs text-ink-sub">자재명과 공간만 입력하면 저장할 수 있어요.</p>}
      </div>
    </>
  );
}
