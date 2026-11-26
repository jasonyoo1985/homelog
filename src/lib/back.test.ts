import { describe, expect, it } from 'vitest';
import { decideBack, popBack, pushBack } from './back';

describe('decideBack', () => {
  it('홈에서는 첫 번째는 안내, 2초 안 두 번째는 종료', () => {
    expect(decideBack('/', false, 0, 10000).type).toBe('exit-prompt');
    expect(decideBack('/', false, 9000, 10000).type).toBe('exit');
  });
  it('다른 탭은 홈으로', () => expect(decideBack('/materials', true, 0, 1)).toEqual({ type: 'navigate', to: '/' }));
  it('하위 화면은 이전 화면(없으면 상위 탭)', () => {
    expect(decideBack('/materials/abc', true, 0, 1)).toEqual({ type: 'navigate', to: -1 });
    expect(decideBack('/materials/abc', false, 0, 1)).toEqual({ type: 'navigate', to: '/materials' });
    expect(decideBack('/warranty', false, 0, 1)).toEqual({ type: 'navigate', to: '/' });
  });
});
describe('back stack', () => {
  it('등록된 팝업을 먼저 닫음', () => {
    let closed = 0; const off = pushBack(() => { closed++; });
    expect(popBack()).toBe(true); expect(closed).toBe(1); expect(popBack()).toBe(false); off();
  });
});
