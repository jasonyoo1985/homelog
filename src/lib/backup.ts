import { db } from '@/db/db';
import { uid } from '@/db/repo';
import { deriveStatus } from './status';
import type { MaterialCategory, MaterialItem, StoredPhoto } from '@/db/types';
import { MATERIAL_CATEGORIES } from '@/db/types';

export const BACKUP_SCHEMA = 1;

export function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
}
export function dataUrlToBlob(u: string): Blob {
  const [head, b64] = u.split(',');
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? 'application/octet-stream';
  const bin = atob(b64); const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

interface JPhoto { id: string; blob: string; thumb: string; width: number; height: number; createdAt: number }
export async function encodePhotos(ps: StoredPhoto[] = []): Promise<JPhoto[]> {
  return Promise.all(ps.map(async (p) => ({ id: p.id, blob: await blobToDataUrl(p.blob), thumb: await blobToDataUrl(p.thumb), width: p.width, height: p.height, createdAt: p.createdAt })));
}
export function decodePhotos(js: JPhoto[] = []): StoredPhoto[] {
  return js.map((p) => ({ id: p.id, blob: dataUrlToBlob(p.blob), thumb: dataUrlToBlob(p.thumb), width: p.width, height: p.height, createdAt: p.createdAt }));
}

/** 백업 대상 테이블과, 사진(Blob)이 들어 있는 필드 이름 */
const TABLES = [
  ['houses', null], ['materials', 'photos'], ['repairs', 'photos'], ['documents', 'attachments'],
  ['utilities', null], ['checklist', null], ['contacts', null], ['inspections', 'photos'],
] as const;
type TableName = (typeof TABLES)[number][0];

export interface BackupFile { app: 'homelog'; kind: 'backup'; schema: number; exportedAt: number; data: Record<string, unknown[]> }

type AnyTable = { toArray(): Promise<unknown[]>; clear(): Promise<void>; bulkPut(r: unknown[]): Promise<unknown> };
const tbl = (n: TableName): AnyTable => (db as unknown as Record<string, AnyTable>)[n];

export async function buildBackup(now = Date.now()): Promise<BackupFile> {
  const data: Record<string, unknown[]> = {};
  for (const [name, photoKey] of TABLES) {
    const rows = await tbl(name).toArray();
    data[name] = photoKey
      ? await Promise.all(rows.map(async (r) => ({ ...(r as object), [photoKey]: await encodePhotos((r as Record<string, StoredPhoto[]>)[photoKey]) })))
      : rows;
  }
  return { app: 'homelog', kind: 'backup', schema: BACKUP_SCHEMA, exportedAt: now, data };
}

export function isBackup(x: unknown): x is BackupFile {
  const b = x as Partial<BackupFile> | null;
  return !!b && b.app === 'homelog' && b.kind === 'backup' && typeof b.schema === 'number' && b.schema <= BACKUP_SCHEMA && !!b.data && typeof b.data === 'object';
}

/** 'replace'는 기존 기록을 모두 지우고 백업으로 바꾸고, 'merge'는 같은 id만 덮어쓰고 나머지는 남긴다 */
export async function restoreBackup(file: BackupFile, mode: 'merge' | 'replace'): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  await db.transaction('rw', [db.houses, db.materials, db.repairs, db.documents, db.utilities, db.checklist, db.contacts, db.inspections], async () => {
    for (const [name, photoKey] of TABLES) {
      const rows = (file.data[name] ?? []) as Record<string, unknown>[];
      const decoded = rows.map((r) => (photoKey ? { ...r, [photoKey]: decodePhotos(r[photoKey] as JPhoto[]) } : r));
      if (mode === 'replace') await tbl(name).clear();
      if (decoded.length) await tbl(name).bulkPut(decoded);
      counts[name] = decoded.length;
    }
  });
  return counts;
}

export function backupFilename(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `homelog-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`;
}

/** ── 자재 팩: 자재 목록만 담은 가져오기 파일(내 집 설명서 등). 제조사·모델명·구입가 등 아는 정보를 미리 채워 둔다 ── */
export interface PackItem {
  roomName: string; category: MaterialCategory; name: string; brand?: string; modelName?: string; spec?: string;
  customerCenter?: string; purchaseUrlOrNote?: string; purchasePrice?: number; maintenanceCycleMonths?: number; installedDate?: string;
  /** 메모(상세 화면의 메모 카드로 표시) */
  memo?: string;
}
export interface PackFile { app: 'homelog'; kind: 'pack'; title?: string; materials: PackItem[] }

const str = (v: unknown, max = 300): string | undefined => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
export function parsePack(x: unknown): PackItem[] | null {
  const p = x as Partial<PackFile> | null;
  if (!p || p.app !== 'homelog' || p.kind !== 'pack' || !Array.isArray(p.materials)) return null;
  const out: PackItem[] = [];
  for (const m of p.materials as unknown as Record<string, unknown>[]) {
    const name = str(m?.name, 80), roomName = str(m?.roomName, 30);
    if (!name || !roomName) continue;
    const cat = MATERIAL_CATEGORIES.find((c) => c === m.category) ?? '기타';
    const price = Number(m.purchasePrice), cycle = Number(m.maintenanceCycleMonths);
    out.push({
      roomName, category: cat, name, brand: str(m.brand, 60), modelName: str(m.modelName, 80), spec: str(m.spec), customerCenter: str(m.customerCenter, 400),
      purchaseUrlOrNote: str(m.purchaseUrlOrNote, 400), memo: str(m.memo, 800), purchasePrice: price > 0 ? Math.round(price) : undefined,
      maintenanceCycleMonths: cycle > 0 ? Math.round(cycle) : undefined, installedDate: /^\d{4}-\d{2}-\d{2}$/.test(String(m.installedDate)) ? String(m.installedDate) : undefined,
    });
  }
  return out;
}

/** 같은 공간·이름이 이미 있으면 건너뛰고 추가 */
export async function importPack(houseId: string, items: PackItem[], now = Date.now()): Promise<number> {
  const have = new Set((await db.materials.where('houseId').equals(houseId).toArray()).map((m) => `${m.roomName}|${m.name}`));
  const rows: MaterialItem[] = [];
  for (const it of items) {
    const key = `${it.roomName}|${it.name}`;
    if (have.has(key)) continue;
    have.add(key); // 같은 팩 안의 중복도 한 번만
    const { memo, ...rest } = it;
    const base = { ...rest, discoveryNotes: memo, houseId, photos: [] as StoredPhoto[] };
    rows.push({ ...base, id: uid(), status: deriveStatus(base), createdAt: now, updatedAt: now });
  }
  if (rows.length) await db.materials.bulkAdd(rows);
  return rows.length;
}
