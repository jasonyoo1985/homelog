import { describe, expect, it } from 'vitest';
import type { Release } from '@/data/releases';
import { decideWhatsNew, mergeNotes, pendingNotes, sinceBuild } from './whatsnew';

const r = (build: number): Release => ({ id: `r${build}`, build, title: `t${build}`, subtitle: 's', items: [{ emoji: 'x', tone: 'blue', kind: 'new', title: `i${build}`, desc: 'd' }] });
const all = [r(17), r(16), r(15), r(13)];

describe('sinceBuild', () => {
  it('빌드가 저장돼 있으면 그대로, 예전 id만 있으면 id로 찾음, 아무것도 없으면 null', () => {
    expect(sinceBuild('r15', 16, all)).toBe(16);
    expect(sinceBuild('r15', null, all)).toBe(15);
    expect(sinceBuild('모르는id', null, all)).toBe(0);
    expect(sinceBuild(null, null, all)).toBeNull();
  });
});
describe('pendingNotes/mergeNotes', () => {
  it('본 이후~설치된 빌드까지만, 여러 버전을 건너뛰면 모아서 보여줌', () => {
    expect(pendingNotes(all, 15, 17).map((x) => x.build)).toEqual([17, 16]);
    expect(pendingNotes(all, 17, 17)).toEqual([]);
    expect(pendingNotes(all, 13, 16).map((x) => x.build)).toEqual([16, 15]);
    const m = mergeNotes(pendingNotes(all, 13, 17))!;
    expect(m.id).toBe('r17'); expect(m.items.map((i) => i.title)).toEqual(['i17', 'i16', 'i15']);
    expect(m.subtitle).toContain('3개 버전');
    expect(mergeNotes([])).toBeNull();
  });
});
describe('decideWhatsNew', () => {
  it('처음 설치는 조용히', () => expect(decideWhatsNew(null, false, all, 17).kind).toBe('silent'));
  it('같은 버전 용량만 줄인 빌드(안내 id가 같던 문제)도 새 빌드면 보여줌', () => {
    const d = decideWhatsNew(15, true, all, 16);
    expect(d.kind).toBe('show'); expect(d.notes?.items[0].title).toBe('i16');
  });
  it('이미 본 빌드면 숨김', () => expect(decideWhatsNew(17, true, all, 17).kind).toBe('hide'));
  it('기록 없는 구버전 사용자는 최신 1개', () => expect(decideWhatsNew(null, true, all, 17).notes?.items).toHaveLength(1));
});
