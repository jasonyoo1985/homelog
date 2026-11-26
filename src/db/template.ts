import { db } from './db';
import { uid } from './repo';
import type { MaterialCategory, MaterialItem } from './types';

interface T { room: string; category: MaterialCategory; name: string; cycle?: number }

/** 한국 아파트 표준 자재/설비 25종. cycle은 '일반적 권장 주기(참고값)'이며 사용자가 수정할 수 있다. */
export const STANDARD_TEMPLATE: T[] = [
  { room: '거실', category: '바닥재/마루/타일', name: '거실 마루' },
  { room: '거실', category: '벽지/도장', name: '거실 벽지' },
  { room: '거실', category: '창호/방충망', name: '거실 창호/방충망' },
  { room: '거실', category: '조명/전기', name: '거실 조명/스위치' },
  { room: '거실', category: '에어컨/냉난방', name: '거실 에어컨', cycle: 3 },
  { room: '거실', category: '보일러/환기', name: '전열교환기(환기장치)', cycle: 6 },
  { room: '주방', category: '주방설비', name: '싱크대/상판' },
  { room: '주방', category: '주방설비', name: '주방 수전' },
  { room: '주방', category: '주방설비', name: '인덕션/가스레인지' },
  { room: '주방', category: '주방설비', name: '주방 후드', cycle: 3 },
  { room: '주방', category: '바닥재/마루/타일', name: '주방 벽 타일' },
  { room: '안방', category: '수납/붙박이장', name: '안방 붙박이장' },
  { room: '안방', category: '도어락/문', name: '안방 방문' },
  { room: '안방', category: '벽지/도장', name: '안방 벽지' },
  { room: '작은방', category: '도어락/문', name: '작은방 방문' },
  { room: '작은방', category: '벽지/도장', name: '작은방 벽지' },
  { room: '욕실1', category: '욕실설비', name: '욕실1 양변기' },
  { room: '욕실1', category: '욕실설비', name: '욕실1 세면대/수전' },
  { room: '욕실1', category: '욕실설비', name: '욕실1 샤워기/수전' },
  { room: '욕실1', category: '바닥재/마루/타일', name: '욕실1 바닥/벽 타일' },
  { room: '욕실2', category: '욕실설비', name: '욕실2 양변기' },
  { room: '욕실2', category: '욕실설비', name: '욕실2 세면대/수전' },
  { room: '현관', category: '도어락/문', name: '현관 도어락(건전지)', cycle: 6 },
  { room: '현관', category: '도어락/문', name: '현관 중문' },
  { room: '다용도실', category: '보일러/환기', name: '보일러', cycle: 12 },
];

export function buildTemplateItems(houseId: string, now = Date.now()): MaterialItem[] {
  return STANDARD_TEMPLATE.map((t) => ({
    id: uid(), houseId, roomName: t.room, category: t.category, name: t.name,
    status: 'UNKNOWN', photos: [], maintenanceCycleMonths: t.cycle, createdAt: now, updatedAt: now,
  }));
}

/** 고른 항목만 추가. 같은 공간·이름이 이미 있으면 건너뛴다. 생성 개수를 반환 */
export async function addTemplateItems(houseId: string, indices: number[]): Promise<number> {
  return db.transaction('rw', db.materials, async () => {
    const existing = await db.materials.where('houseId').equals(houseId).toArray();
    const have = new Set(existing.map((m) => `${m.roomName}|${m.name}`));
    const now = Date.now();
    const items = buildTemplateItems(houseId, now).filter((m, i) => indices.includes(i) && !have.has(`${m.roomName}|${m.name}`));
    await db.materials.bulkAdd(items);
    return items.length;
  });
}

/** 자재가 하나도 없을 때만 전체 생성 (중복 방지). 생성 개수를 반환 */
export async function createStandardTemplate(houseId: string): Promise<number> {
  return db.transaction('rw', db.materials, async () => {
    if ((await db.materials.where('houseId').equals(houseId).count()) > 0) return 0;
    const items = buildTemplateItems(houseId);
    await db.materials.bulkAdd(items);
    return items.length;
  });
}
