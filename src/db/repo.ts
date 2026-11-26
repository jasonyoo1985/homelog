import { db } from './db';
import type { HouseProfile, MaterialItem } from './types';

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const DEFAULT_ROOMS = ['거실', '주방', '안방', '작은방', '욕실1', '욕실2', '현관', '다용도실', '베란다'];

/** 첫 실행 시 '우리 집' 프로필을 자동 생성해 입력 부담을 없앤다. */
export async function ensureHouse(): Promise<HouseProfile> {
  const existing = await db.houses.toCollection().first();
  if (existing) return existing;
  const now = Date.now();
  const house: HouseProfile = {
    id: uid(),
    name: '우리 집',
    housingType: '아파트',
    rooms: [...DEFAULT_ROOMS],
    createdAt: now,
    updatedAt: now,
  };
  await db.houses.add(house);
  return house;
}

/** 등록 순(오래된 것 먼저). createdAt은 인덱스가 아니므로 메모리에서 정렬한다. */
export async function listMaterials(): Promise<MaterialItem[]> {
  const all = await db.materials.toArray();
  return all.sort((a, b) => a.createdAt - b.createdAt);
}
