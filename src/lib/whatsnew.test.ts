import { describe, expect, it } from 'vitest';
import { shouldShowRelease } from './whatsnew';

describe('shouldShowRelease', () => {
  it('이미 본 안내는 숨김', () => expect(shouldShowRelease('a', 'a', true)).toBe('hide'));
  it('처음 설치는 조용히 처리', () => expect(shouldShowRelease(null, 'a', false)).toBe('silent'));
  it('업데이트한 기존 사용자는 보여줌', () => {
    expect(shouldShowRelease(null, 'a', true)).toBe('show');
    expect(shouldShowRelease('old', 'a', false)).toBe('show');
  });
});
