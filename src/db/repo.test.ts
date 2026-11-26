import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { DEFAULT_ROOMS, ensureHouse, listMaterials } from './repo';
import { createStandardTemplate } from './template';

describe('ensureHouse', () => {
  beforeEach(async () => {
    await db.houses.clear();
  });
  it('최초 실행 시 기본 프로필을 만들고 이후엔 재사용', async () => {
    const a = await ensureHouse();
    const b = await ensureHouse();
    expect(a.id).toBe(b.id);
    expect(a.rooms).toEqual(DEFAULT_ROOMS);
    expect(await db.houses.count()).toBe(1);
  });
});

describe('listMaterials', () => {
  beforeEach(async () => { await db.materials.clear(); });
  it('인덱스 오류 없이 등록 순으로 조회', async () => {
    await createStandardTemplate('h1');
    const items = await listMaterials();
    expect(items).toHaveLength(25);
    expect(items[0].createdAt).toBeLessThanOrEqual(items[24].createdAt);
  });
});
