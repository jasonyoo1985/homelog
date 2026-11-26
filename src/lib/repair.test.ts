import { describe, expect, it } from 'vitest';
import { compareQuotes, costTotals, nextStage } from './repair';

describe('repair', () => {
  it('올해/누적 합계', () => {
    const r = [
      { cost: 100000, occurredDate: '2026-03-01', repairedDate: '2026-03-05' },
      { cost: 50000, occurredDate: '2025-12-30', repairedDate: '2026-01-02' },
      { cost: 20000, occurredDate: '2025-05-01' },
      { occurredDate: '2026-01-01' },
    ];
    expect(costTotals(r, 2026)).toEqual({ year: 150000, all: 170000 });
  });
  it('견적 비교', () => {
    const c = compareQuotes([{ id: 'a', vendor: 'A', amount: 300000 }, { id: 'b', vendor: 'B', amount: 220000 }, { id: 'c', vendor: 'C', amount: 0 }]);
    expect(c).toEqual({ lowestId: 'b', min: 220000, max: 300000, saving: 80000 });
    expect(compareQuotes([])).toEqual({});
  });
  it('다음 단계', () => { expect(nextStage('FOUND')).toBe('IN_PROGRESS'); expect(nextStage('DONE')).toBeNull(); });
});
