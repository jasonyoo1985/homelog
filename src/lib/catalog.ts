import { db } from '@/db/db';
import { MATERIAL_CATEGORIES, type CatalogEntry, type MaterialCategory } from '@/db/types';

export interface CatalogFile { app: 'homelog'; kind: 'catalog'; title?: string; source?: string; note?: string; items: unknown[] }

const str = (v: unknown, max = 300): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** 가져온 파일을 검증해서 카탈로그 항목으로 바꾼다(외부 파일이므로 신뢰하지 않는다). 형식이 다르면 null */
export function parseCatalog(x: unknown): { title: string; note: string; entries: CatalogEntry[] } | null {
  const f = x as Partial<CatalogFile> | null;
  if (!f || f.app !== 'homelog' || f.kind !== 'catalog' || !Array.isArray(f.items)) return null;
  const entries: CatalogEntry[] = [];
  const seen = new Set<string>();
  for (const raw of f.items as Record<string, unknown>[]) {
    const id = str(raw?.id, 40), item = str(raw?.item, 60), name = str(raw?.name, 120);
    if (!id || !item || !name || seen.has(id)) continue;
    seen.add(id);
    entries.push({
      id, item, name,
      category: (MATERIAL_CATEGORIES as readonly string[]).includes(String(raw.category)) ? (raw.category as MaterialCategory) : '기타',
      space: str(raw.space, 60), variant: str(raw.variant, 60), trade: str(raw.trade, 120),
      model: str(raw.model, 400), maker: str(raw.maker, 80),
      page: Number.isFinite(Number(raw.page)) ? Number(raw.page) : undefined,
    });
  }
  return { title: str(f.title, 80) || '마감재 카탈로그', note: str(f.note, 400), entries };
}

/** 기존 카탈로그를 모두 바꾸고 새로 저장 */
export async function replaceCatalog(entries: CatalogEntry[]): Promise<number> {
  await db.transaction('rw', db.catalog, async () => { await db.catalog.clear(); await db.catalog.bulkAdd(entries); });
  return entries.length;
}

/** 검색용으로 글자를 정리: 소문자, 공백·기호 제거 */
export const norm = (s: string): string => s.toLowerCase().replace(/[\s()\[\]·,/_*\-]+/g, '');

export interface ItemOption { item: string; count: number }
/** 품목 목록(가나다순)과 각 품목의 제품 수. query가 있으면 품목명 또는 그 안의 제품명·모델명이 맞는 품목만 */
export function itemOptions(entries: CatalogEntry[], query = ''): ItemOption[] {
  const q = norm(query);
  const map = new Map<string, number>();
  for (const e of entries) {
    if (q && !norm(`${e.item} ${e.name} ${e.model} ${e.maker}`).includes(q)) continue;
    map.set(e.item, (map.get(e.item) ?? 0) + 1);
  }
  return [...map.entries()].map(([item, count]) => ({ item, count })).sort((a, b) => a.item.localeCompare(b.item, 'ko'));
}

/** 한 품목의 제품 목록. query로 이름·모델·업체·공간·옵션을 검색 */
export function entriesOfItem(entries: CatalogEntry[], item: string, query = ''): CatalogEntry[] {
  const q = norm(query);
  return entries.filter((e) => e.item === item && (!q || norm(`${e.name} ${e.model} ${e.maker} ${e.space} ${e.variant}`).includes(q)));
}

/** 카탈로그의 공간 이름을 앱의 공간 이름으로 바꾼다. 못 찾으면 첫 후보 그대로 */
export function roomFor(space: string, rooms: string[]): string {
  const has = (r: string) => rooms.includes(r);
  const pick = (...c: string[]) => c.find(has);
  const s = space.replace(/\s/g, '');
  if (s.startsWith('주방')) return pick('주방') ?? '주방';
  if (s.startsWith('침실1')) return pick('안방', '침실1') ?? '안방';
  if (s.startsWith('침실2')) return pick('작은방', '침실2') ?? '작은방';
  if (s.startsWith('욕실2')) return pick('욕실2') ?? '욕실2';
  if (s.startsWith('욕실')) return pick('욕실1', '욕실') ?? '욕실1';
  if (s.startsWith('현관')) return pick('현관') ?? '현관';
  if (s.startsWith('거실')) return pick('거실') ?? '거실';
  if (s.startsWith('다용도실')) return pick('다용도실') ?? '다용도실';
  if (s.startsWith('실외기실') || s.startsWith('발코니')) return pick('베란다', '실외기실') ?? '실외기실';
  return s.split(/[,/]/)[0] || '거실';
}

export interface Prefill { name: string; roomName: string; category: MaterialCategory; brand: string; modelName: string; spec: string; note: string }

/** 고른 카탈로그 항목으로 자재 등록 폼에 채울 값을 만든다 */
export function prefillFromEntry(e: CatalogEntry, rooms: string[]): Prefill {
  const roomName = roomFor(e.space, rooms);
  const optional = /유상옵션/.test(e.variant);
  return {
    name: e.name.replace(/\(\d+[*,]\d+[^)]*\)$/, '').trim(),
    roomName,
    category: e.category,
    brand: e.maker,
    modelName: e.model,
    spec: [e.name.match(/\((\d+[*,]\d+[^)]*)\)$/)?.[1], optional ? e.variant : ''].filter(Boolean).join(' · '),
    note: `마감재 리스트: ${e.space} ${e.variant}${e.trade ? ` · ${e.trade}` : ''}`,
  };
}
