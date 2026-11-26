import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseRelease, pickRemoteRelease } from './appUpdate';
import { LATEST, RELEASES } from '@/data/releases';

const item = { emoji: '🎉', tone: 'blue', kind: 'new', title: 't', desc: 'd' };
const rel = (build: number) => ({ id: `r${build}`, build, title: `새 기능${build}`, subtitle: '설명', items: [item] });

describe('pickRemoteRelease', () => {
  it('설치된 빌드보다 큰 안내만 모아서 돌려줌', () => {
    const m = pickRemoteRelease({ releases: [rel(17), rel(16), rel(15)] }, 15)!;
    expect(m.build).toBe(17); expect(m.items).toHaveLength(2);
  });
  it('새 안내가 없으면 null', () => expect(pickRemoteRelease({ releases: [rel(15)] }, 15)).toBeNull());
  it('이상한 형식은 무시', () => {
    for (const bad of [null, {}, { releases: [] }, { releases: [{ id: 1 }] }, 'x', { releases: [{ ...rel(3), build: 'x' }] }]) expect(pickRemoteRelease(bad, 1)).toBeNull();
  });
});

describe('parseRelease', () => {
  it('잘못된 항목은 걸러내고 정상 항목만 유지(외부 입력 검증)', () => {
    const r = parseRelease({ ...rel(2), items: [item, { emoji: 'x', tone: 'purple', kind: 'new', title: 't', desc: 'd' }, null] });
    expect(r?.items).toHaveLength(1);
  });
  it('링크(cta)는 외부 안내문에서는 받지 않음', () => {
    const r = parseRelease({ ...rel(2), items: [{ ...item, cta: { label: 'x', to: 'https://evil.example' } }] });
    expect(r?.items[0]).not.toHaveProperty('cta');
  });
});

describe('릴리스 노트 파일', () => {
  it('앱 내장본과 웹 공개본(docs/releases.json)이 같다', () => {
    expect(JSON.parse(readFileSync('docs/releases.json', 'utf8')).releases).toEqual(RELEASES);
  });
  it('빌드 번호는 중복 없이 내림차순, id도 중복 없음', () => {
    const b = RELEASES.map((r) => r.build);
    expect([...b].sort((x, y) => y - x)).toEqual(b);
    expect(new Set(b).size).toBe(b.length);
    expect(new Set(RELEASES.map((r) => r.id)).size).toBe(RELEASES.length);
    expect(LATEST).toBe(RELEASES[0]);
  });
  it('이번 빌드(app-version.json)의 릴리스 노트가 반드시 있어야 한다', () => {
    const build = JSON.parse(readFileSync('app-version.json', 'utf8')).build;
    expect(LATEST.build).toBe(build);
  });
});
