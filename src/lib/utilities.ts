import type { UtilityRecord } from '@/db/types';

export const UTILITY_KINDS: UtilityRecord['kind'][] = ['관리비', '전기', '가스', '수도', '기타'];

export function addMonthKey(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** 마지막 달부터 거슬러 n개월의 월별 합계(기록 없는 달은 0) */
export function monthlyTotals(records: Pick<UtilityRecord, 'month' | 'amount'>[], endMonth: string, n = 6): { month: string; total: number }[] {
  const sums = new Map<string, number>();
  for (const r of records) sums.set(r.month, (sums.get(r.month) ?? 0) + r.amount);
  return Array.from({ length: n }, (_, i) => { const month = addMonthKey(endMonth, i - (n - 1)); return { month, total: sums.get(month) ?? 0 }; });
}

/** 이번 달이 지난달보다 몇 % 늘었는지(지난달 기록이 없으면 null) */
export function changeVsPrev(totals: { total: number }[]): number | null {
  if (totals.length < 2) return null;
  const cur = totals[totals.length - 1].total, prev = totals[totals.length - 2].total;
  return prev > 0 && cur > 0 ? Math.round(((cur - prev) / prev) * 100) : null;
}
