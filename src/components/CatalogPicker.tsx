import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { MATERIAL_CATEGORIES, type CatalogEntry, type MaterialCategory } from '@/db/types';
import { categoryCounts, entriesOfItem, itemOptions, prefillFromEntry, type Prefill } from '@/lib/catalog';
import { Combobox } from './Combobox';
import { inputCls } from './Field';

interface Props {
  rooms: string[];
  category: MaterialCategory;
  onCategory: (c: MaterialCategory) => void;
  onPick: (p: Prefill) => void;
  /** 직접 입력을 고르면 호출 (자재명 칸으로 이동) */
  onManual: () => void;
}

/** 카테고리 → 품목 → 제품 순서로 골라 자재 등록 폼을 한 번에 채운다. 각 단계에서 '직접 입력'도 가능 */
export function CatalogPicker({ rooms, category, onCategory, onPick, onManual }: Props) {
  const entries = useLiveQuery(() => db.catalog.toArray(), []);
  const [cat, setCat] = useState<MaterialCategory | ''>('');
  const [item, setItem] = useState('');
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [picked, setPicked] = useState<CatalogEntry | null>(null);
  const [manual, setManual] = useState(false);

  if (!entries) return null;
  const counts = categoryCounts(entries);
  const items = itemOptions(entries, q1, cat);
  const products = item ? entriesOfItem(entries, item, q2) : [];

  const goManual = () => { setManual(true); setPicked(null); onManual(); };
  const changeCat = (c: MaterialCategory | '') => {
    setCat(c); setItem(''); setPicked(null); setManual(false); setQ1(''); setQ2('');
    onCategory(c || '기타');
  };

  return (
    <section className="card-3d flex flex-col gap-3 p-4">
      <div>
        <h2 className="text-sm font-bold">카테고리 · 품목 · 제품 고르기</h2>
        <p className="break-keep text-xs text-ink-sub">고르면 이름·공간·제조사·모델명이 자동으로 채워져요. 목록에 없으면 '직접 입력'을 누르세요.</p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-ink-sub">① 카테고리</span>
        <select className={inputCls} value={cat} onChange={(e) => changeCat(e.target.value as MaterialCategory | '')}>
          <option value="">전체 보기</option>
          {MATERIAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}{counts.get(c) ? ` (${counts.get(c)})` : ''}</option>)}
        </select>
      </label>

      <Combobox label="② 품목" placeholder={cat ? `${cat}의 품목 선택` : '품목 선택 (예: 강마루, 조명, 수전)'} selectedLabel={item}
        options={items.map((o) => ({ value: o.item, label: o.item, sub: `제품 ${o.count}개` }))} query={q1} onQuery={setQ1}
        onSelect={(v) => { setItem(v); setPicked(null); setManual(false); setQ2(''); }}
        manualLabel="목록에 없어요 (직접 입력)" onManual={goManual} emptyText="맞는 품목이 없어요" />

      <Combobox label="③ 제품" placeholder={item ? `${item} 중에서 선택 (${products.length}개)` : '먼저 품목을 선택하세요'} disabled={!item}
        selectedLabel={picked ? `${picked.name} · ${picked.space}` : ''}
        options={products.map((e) => ({
          value: e.id, label: `${e.name} · ${e.space}`,
          sub: [e.model, e.maker, /유상옵션/.test(e.variant) ? e.variant : ''].filter(Boolean).join(' · '),
        }))} query={q2} onQuery={setQ2} emptyText="맞는 제품이 없어요"
        manualLabel="제품이 없어요 (직접 입력)" onManual={goManual}
        onSelect={(id) => {
          const e = entries.find((x) => x.id === id);
          if (e) { setPicked(e); setManual(false); setCat(e.category); onCategory(e.category); onPick(prefillFromEntry(e, rooms)); }
        }} />

      {picked && <p className="break-keep rounded-2xl bg-primary-50 px-3 py-2 text-xs text-primary">아래 칸을 채웠어요. 다르면 고쳐서 저장하세요.</p>}
      {manual && <p className="break-keep rounded-2xl bg-primary-50 px-3 py-2 text-xs text-primary">아래 칸에 직접 입력해 주세요. (카테고리: {category})</p>}
    </section>
  );
}
