import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseRelease, pickRemoteRelease } from './appUpdate';
import { LATEST, RELEASES } from '@/data/releases';

const sample = { id: 'r2', title: '새 기능', subtitle: '설명', items: [{ emoji: '🎉', tone: 'blue', kind: 'new', title: 't', desc: 'd' }] };

describe('pickRemoteRelease', () => {
  it('설치된 앱보다 새로운 안내가 맨 앞에 있으면 그것을 돌려줌', () => {
    expect(pickRemoteRelease({ releases: [sample, { ...sample, id: 'r1' }] }, 'r1')?.id).toBe('r2');
  });
  it('맨 앞 안내가 이미 설치된 앱의 최신과 같으면 없음', () => {
    expect(pickRemoteRelease({ releases: [{ ...sample, id: 'r1' }] }, 'r1')).toBeNull();
  });
  it('이상한 형식은 무시', () => {
    for (const bad of [null, {}, { releases: [] }, { releases: [{ id: 1 }] }, 'x']) expect(pickRemoteRelease(bad, 'r1')).toBeNull();
  });
});

describe('parseRelease', () => {
  it('잘못된 항목은 걸러내고 정상 항목만 유지(외부 입력 검증)', () => {
    const r = parseRelease({ ...sample, items: [sample.items[0], { emoji: 'x', tone: 'purple', kind: 'new', title: 't', desc: 'd' }, null] });
    expect(r?.items).toHaveLength(1);
  });
  it('링크(cta)는 외부 안내문에서는 받지 않음', () => {
    const r = parseRelease({ ...sample, items: [{ ...sample.items[0], cta: { label: 'x', to: 'https://evil.example' } }] });
    expect(r?.items[0]).not.toHaveProperty('cta');
  });
});

describe('릴리스 노트 파일', () => {
  it('앱 내장본과 웹 공개본(docs/releases.json)이 같다', () => {
    const web = JSON.parse(readFileSync('docs/releases.json', 'utf8'));
    expect(web.releases).toEqual(RELEASES);
  });
  it('id가 중복되지 않고 최신이 맨 앞', () => {
    expect(new Set(RELEASES.map((r) => r.id)).size).toBe(RELEASES.length);
    expect(LATEST).toBe(RELEASES[0]);
  });
});
