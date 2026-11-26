import { describe, expect, it, beforeEach } from 'vitest';
import { addMonths, dueInfo, dueLabel } from './dates';
import { inquiryText, naverUrl, searchQuery } from './search';
import { deriveStatus } from './status';
import { STANDARD_TEMPLATE, createStandardTemplate } from '@/db/template';
import { db } from '@/db/db';

describe('dates', () => {
  it('월말 보정', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-11-26', 12)).toBe('2027-11-26');
    expect(addMonths('2026-11-26', 3)).toBe('2027-02-26');
  });
  it('교체 예정 상태', () => {
    expect(dueInfo(undefined, undefined).state).toBe('none');
    expect(dueInfo(undefined, 6).state).toBe('noRecord');
    expect(dueInfo('2026-01-01', 3, '2026-06-01').state).toBe('overdue');
    expect(dueInfo('2026-03-01', 3, '2026-05-20').state).toBe('soon');
    expect(dueInfo('2026-05-01', 12, '2026-06-01').state).toBe('ok');
    expect(dueLabel(dueInfo('2026-01-01', 3, '2026-06-01'))).toBe('교체 61일 지남');
  });
});

describe('status/search', () => {
  it('상태 자동 계산', () => {
    expect(deriveStatus({ photos: [] })).toBe('UNKNOWN');
    expect(deriveStatus({ photos: [], spec: '화이트' })).toBe('PARTIAL');
    expect(deriveStatus({ photos: [], brand: 'A', modelName: 'B' })).toBe('VERIFIED');
  });
  it('검색어/문의문구', () => {
    expect(searchQuery({ name: '거실 마루', brand: 'LG', modelName: '' })).toBe('LG 거실 마루');
    expect(naverUrl('LG 마루')).toContain('query=LG%20%EB%A7%88%EB%A3%A8');
    expect(inquiryText({ name: '보일러', roomName: '다용도실' })).toContain('「보일러」');
  });
});

describe('template', () => {
  beforeEach(async () => { await db.materials.clear(); });
  it('표준 25종, 중복 생성 방지', async () => {
    expect(STANDARD_TEMPLATE).toHaveLength(25);
    expect(await createStandardTemplate('h1')).toBe(25);
    expect(await createStandardTemplate('h1')).toBe(0);
    expect(await db.materials.count()).toBe(25);
  });
});
