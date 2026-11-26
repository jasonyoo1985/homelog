import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { DEFAULT_ROOMS, ensureHouse } from './repo';

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
