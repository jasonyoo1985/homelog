import { describe, expect, it } from 'vitest';
import { shouldShowRelease } from './whatsnew';

describe('shouldShowRelease', () => {
  it('이미 본 안내는 숨김', () => expect(shouldShowRelease('a', 'a', true)).toBe('hide'));
  it('처음 설치는 조용히 처리', () => expect(shouldShowRelease(null, 'a', false)).toBe('silent'));
  it('이전에 앱을 쓴 기기(기록이 없어도)는 보여줌', () => {
    expect(shouldShowRelease(null, 'a', true)).toBe('show');
  });
  it('이전 안내를 본 사용자는 새 안내를 보여줌', () => {
    expect(shouldShowRelease('old', 'a', false)).toBe('show');
    expect(shouldShowRelease('old', 'a', true)).toBe('show');
  });
});
