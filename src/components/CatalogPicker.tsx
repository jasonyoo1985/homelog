import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { CatalogEntry } from '@/db/types';
import { entriesOfItem, itemOptions, prefillFromEntry, type Prefill } from '@/lib/catalog';
import { Combobox } from './Combobox';

/** 마감재 리스트에서 '품목 → 제품'을 골라 자재 등록 폼을 한 번에 채운다 */
export function CatalogPicker({ rooms, onPick }: { rooms: string[]; onPick: (p: Prefill) => void }) {
  const entries = useLiveQuery(() => db.catalog.toArray(), []);
  const [item, setItem] = useState('');
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [picked, setPicked] = useState<CatalogEntry | null>(null);

  if (!entries) return null;
  if (entries.length === 0) {
    return (
      <Link to="/backup" className="card-3d-press flex items-center justify-between p-4 text-sm">
        <span><b>마감재 리스트가 있나요?</b><span className="block text-xs text-ink-sub">불러오면 품목을 고르고 제품을 골라서 한 번에 채울 수 있어요.</span></span>
        <span className="text-primary">불러오기 ›</span>
      </Link>
    );
  }
  const items = itemOptions(entries, q1);
  const products = item ? entriesOfItem(entries, item, q2) : [];

  return (
    <section className="card-3d flex flex-col gap-3 p-4">
      <div>
        <h2 className="text-sm font-bold">마감재 리스트에서 고르기</h2>
        <p className="text-xs text-ink-sub">품목을 고르고 제품을 고르면 이름·공간·제조사·모델명이 자동으로 채워져요. 직접 입력해도 돼요.</p>
      </div>
      <Combobox label="① 품목" placeholder="품목 선택 (예: 강마루, 조명, 수전)" selectedLabel={item}
        options={items.map((o) => ({ value: o.item, label: o.item, sub: `${o.count}개` }))} query={q1} onQuery={setQ1}
        onSelect={(v) => { setItem(v); setPicked(null); setQ2(''); }} emptyText="맞는 품목이 없어요" />
      <Combobox label="② 제품" placeholder={item ? `${item} 중에서 선택 (${products.length}개)` : '먼저 품목을 선택하세요'} disabled={!item}
        selectedLabel={picked ? `${picked.name} · ${picked.space}` : ''}
        options={products.map((e) => ({
          value: e.id, label: `${e.name} · ${e.space}`,
          sub: [e.model, e.maker, /유상옵션/.test(e.variant) ? e.variant : ''].filter(Boolean).join(' · '),
        }))} query={q2} onQuery={setQ2} emptyText="맞는 제품이 없어요"
        onSelect={(id) => { const e = entries.find((x) => x.id === id); if (e) { setPicked(e); onPick(prefillFromEntry(e, rooms)); } }} />
      {picked && <p className="rounded-2xl bg-primary-50 px-3 py-2 text-xs text-primary">아래 칸을 채웠어요. 사실과 다르면 고쳐서 저장하세요.</p>}
    </section>
  );
}
