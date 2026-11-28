import { useEffect, useRef, useState } from 'react';
import { inputCls } from './Field';
import { useBackClose } from '@/lib/useBackClose';

export interface ComboOption { value: string; label: string; sub?: string }

interface Props {
  label: string;
  placeholder: string;
  /** 선택된 값의 표시 글자(없으면 placeholder) */
  selectedLabel?: string;
  /** 이미 검색어로 걸러진 옵션 (검색은 부모가 처리) */
  options: ComboOption[];
  query: string;
  onQuery: (q: string) => void;
  onSelect: (value: string) => void;
  disabled?: boolean;
  emptyText?: string;
  hint?: string;
}

/** 검색이 되는 드롭다운. 누르면 검색칸과 목록이 펼쳐지고, 고르면 닫힌다 */
export function Combobox({ label, placeholder, selectedLabel, options, query, onQuery, onSelect, disabled, emptyText = '검색 결과가 없어요', hint }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useBackClose(open, () => setOpen(false));
  useEffect(() => {
    if (!open) return;
    const h = (e: Event) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h); document.addEventListener('touchstart', h);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h); };
  }, [open]);

  return (
    <div ref={ref}>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-sub">{label}</span>
      <button type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open}
        className={`${inputCls} flex items-center justify-between gap-2 text-left ${disabled ? 'opacity-50' : ''}`} onClick={() => setOpen((o) => !o)}>
        <span className={`min-w-0 flex-1 truncate ${selectedLabel ? '' : 'text-ink-sub/70'}`}>{selectedLabel || placeholder}</span>
        <span aria-hidden className="text-ink-sub">▾</span>
      </button>
      {hint && !open && <span className="mt-1 block text-xs text-ink-sub">{hint}</span>}
      {open && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-card" role="listbox" aria-label={label}>
          <input className="w-full border-b border-line px-4 py-3 text-[15px] outline-none" placeholder="검색 (이름·모델명·업체·공간)" value={query} onChange={(e) => onQuery(e.target.value)} />
          <ul className="max-h-64 overflow-y-auto" data-noswipe>
            {options.length === 0 ? <li className="px-4 py-4 text-sm text-ink-sub">{emptyText}</li> : options.map((o) => (
              <li key={o.value}>
                <button type="button" role="option" aria-selected={o.label === selectedLabel} className="block w-full border-t border-line px-4 py-3 text-left first:border-0 active:bg-primary-50"
                  onClick={() => { onSelect(o.value); setOpen(false); onQuery(''); }}>
                  <div className="text-[15px] font-semibold">{o.label}</div>
                  {o.sub && <div className="mt-0.5 break-words text-xs leading-snug text-ink-sub">{o.sub}</div>}
                </button>
              </li>))}
          </ul>
        </div>)}
    </div>
  );
}
