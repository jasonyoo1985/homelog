import { describe, expect, it } from 'vitest';
import { fitSize } from './image';

describe('fitSize', () => {
  it('긴 변이 1200 초과면 비율 유지 축소', () => {
    expect(fitSize(4000, 3000, 1200)).toEqual({ width: 1200, height: 900 });
    expect(fitSize(3000, 4000, 1200)).toEqual({ width: 900, height: 1200 });
  });
  it('작은 이미지는 확대하지 않음', () => {
    expect(fitSize(800, 600, 1200)).toEqual({ width: 800, height: 600 });
  });
});
