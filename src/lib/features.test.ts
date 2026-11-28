import { beforeEach, describe, expect, it } from 'vitest';
import { computeWarranty, warrantyLabel } from './warranty';
import { tasksForMonth, BY_MONTH } from '@/data/monthly';
import { computeHealth } from './health';
import { changeVsPrev, monthlyTotals } from './utilities';
import { buildReminders, hashId } from './reminders';
import { buildBackup, decodePhotos, encodePhotos, importPack, isBackup, parsePack, restoreBackup } from './backup';
import { db } from '@/db/db';
import { createStandardTemplate } from '@/db/template';

describe('하자 보증', () => {
  it('공종별 만료일·상태 계산', () => {
    const rows = computeWarranty('2026-07-23', '2028-07-01');
    const finish = rows.find((r) => r.group.id === 'finish')!;
    expect(finish.endDate).toBe('2028-07-23');
    expect(finish.state).toBe('soon');
    expect(rows.find((r) => r.group.id === 'ground')!.endDate).toBe('2036-07-23');
    expect(rows[0].group.years).toBe(2); // 만료가 빠른 것부터
    expect(warrantyLabel({ days: 22, state: 'soon' })).toBe('D-22');
    expect(warrantyLabel({ days: -3, state: 'expired' })).toBe('3일 전에 끝났어요');
  });
});

describe('월별 체크리스트', () => {
  it('매달 공통 + 그 달 항목, 12개월 모두 정의', () => {
    expect(tasksForMonth(11).map((t) => t.key)).toContain('doorlock');
    expect(tasksForMonth(1).length).toBe(4);
    for (let m = 1; m <= 12; m++) expect(BY_MONTH[m]?.length).toBeGreaterThan(0);
  });
});

describe('집 건강 점수', () => {
  it('자재 없으면 null', () => expect(computeHealth({ materials: [], repairs: [], checklistRatio: 0 })).toBeNull());
  it('점수 계산', () => {
    const h = computeHealth({
      materials: [{ status: 'VERIFIED' }, { status: 'UNKNOWN', maintenanceCycleMonths: 3, lastMaintainedDate: '2025-01-01' }] as never,
      repairs: [{ stage: 'FOUND' }], checklistRatio: 0.5,
    }, '2026-06-01')!;
    expect(h.parts).toEqual({ care: 0, repair: 20, routine: 15 });
    expect(h.score).toBe(35);
    expect(h.label).toBe('챙겨볼 때예요');
    // 정보를 안 채워도 점수에 영향이 없다
    const full = computeHealth({ materials: [{ status: 'UNKNOWN' }, { status: 'UNKNOWN' }] as never, repairs: [], checklistRatio: 1 })!;
    expect(full.score).toBe(100);
  });
});

describe('공과금 집계', () => {
  it('최근 n개월 합계와 전월 대비', () => {
    const t = monthlyTotals([{ month: '2026-11', amount: 120000 }, { month: '2026-11', amount: 30000 }, { month: '2026-10', amount: 100000 }], '2026-11', 3);
    expect(t.map((x) => x.month)).toEqual(['2026-09', '2026-10', '2026-11']);
    expect(t.map((x) => x.total)).toEqual([0, 100000, 150000]);
    expect(changeVsPrev(t)).toBe(50);
    expect(changeVsPrev([{ total: 0 }, { total: 5 }])).toBeNull();
  });
});

describe('알림 일정', () => {
  it('교체 3일 전·당일, 보증, 월간 안내를 미래 시각으로만 만든다', () => {
    const now = new Date(2026, 10, 26, 8, 0);
    const r = buildReminders({
      now, warrantyStart: '2026-07-23',
      materials: [{ id: 'm1', name: '보일러', lastMaintainedDate: '2026-06-01', maintenanceCycleMonths: 6 }],
    });
    expect(r.every((x) => x.at > now)).toBe(true);
    expect(r.some((x) => x.route === '/materials/m1' && x.body.includes('3일'))).toBe(true);
    expect(r.some((x) => x.route === '/checklist')).toBe(true);
    expect(new Set(r.map((x) => x.id)).size).toBe(r.length);
    expect(r.length).toBeLessThanOrEqual(50);
  });
  it('같은 키는 같은 id', () => expect(hashId('a')).toBe(hashId('a')));
});

describe('백업/가져오기', () => {
  beforeEach(async () => { await Promise.all([db.houses.clear(), db.materials.clear(), db.repairs.clear(), db.contacts.clear()]); });
  it('사진 Blob 인코딩 왕복', async () => {
    const p = { id: 'p', blob: new Blob(['abc'], { type: 'image/webp' }), thumb: new Blob(['z'], { type: 'image/webp' }), width: 1, height: 1, createdAt: 1 };
    const back = decodePhotos(await encodePhotos([p]));
    expect(back[0].blob.type).toBe('image/webp'); expect(back[0].blob.size).toBe(3);
  });
  it('전체 백업 → 지우기 → 복원', async () => {
    await createStandardTemplate('h1');
    const f = await buildBackup(1700000000000);
    expect(isBackup(f)).toBe(true);
    await db.materials.clear();
    const counts = await restoreBackup(JSON.parse(JSON.stringify(f)), 'replace');
    expect(counts.materials).toBe(25);
    expect(await db.materials.count()).toBe(25);
    expect(isBackup({ app: 'other' })).toBe(false);
  });
  it('자재 팩: 검증·중복 건너뛰기', async () => {
    const pack = { app: 'homelog', kind: 'pack', materials: [
      { roomName: '주방', category: '주방설비', name: '식기세척기', modelName: 'DIB22S', purchasePrice: 1200000, memo: '메모 테스트' },
      { roomName: '주방', category: '주방설비', name: '식기세척기' },
      { roomName: '', name: 'x' }, { name: 'y' },
    ] };
    const items = parsePack(pack)!;
    expect(items).toHaveLength(2);
    expect(await importPack('h9', items)).toBe(1);
    const m = (await db.materials.toArray())[0];
    expect(m.modelName).toBe('DIB22S'); expect(m.purchasePrice).toBe(1200000); expect(m.discoveryNotes).toBe('메모 테스트');
    expect(parsePack({ app: 'homelog', kind: 'backup' })).toBeNull();
  });
});
