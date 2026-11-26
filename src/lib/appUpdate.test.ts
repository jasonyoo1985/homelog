import { describe, expect, it } from 'vitest';
import { decideUpdate } from './appUpdate';

const base = { immediateUpdateAllowed: true, flexibleUpdateAllowed: true };
describe('decideUpdate', () => {
  it('업데이트 없음 → none', () => expect(decideUpdate({ ...base, updateAvailability: 1 })).toBe('none'));
  it('업데이트 있음 → 즉시 우선', () => expect(decideUpdate({ ...base, updateAvailability: 2 })).toBe('immediate'));
  it('즉시 불가면 유연', () => expect(decideUpdate({ immediateUpdateAllowed: false, flexibleUpdateAllowed: true, updateAvailability: 2 })).toBe('flexible'));
  it('진행 중이면 이어서 처리', () => expect(decideUpdate({ ...base, updateAvailability: 3 })).toBe('immediate'));
  it('둘 다 불가 → none', () => expect(decideUpdate({ immediateUpdateAllowed: false, flexibleUpdateAllowed: false, updateAvailability: 2 })).toBe('none'));
});
