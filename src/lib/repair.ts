import type { IssueType, Quote, RepairRecord, RepairStage } from '@/db/types';

export const STAGE_LABEL: Record<RepairStage, string> = { FOUND: '발견', IN_PROGRESS: '진행중', DONE: '완료' };
export const STAGE_CLASS: Record<RepairStage, string> = { FOUND: 'badge-danger', IN_PROGRESS: 'badge-warn', DONE: 'badge-ok' };
export const STAGE_ORDER: RepairStage[] = ['FOUND', 'IN_PROGRESS', 'DONE'];
export const ISSUE_TYPES: IssueType[] = ['파손', '균열', '누수', '곰팡이', '작동불량', '소음/마모', '소모품교체', '기타'];

export const won = (n: number): string => `${Math.round(n).toLocaleString('ko-KR')}원`;
export const manWon = (n: number): string => (n >= 10000 ? `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}만원` : won(n));

/** 올해/누적 수리비. 올해는 완료일(없으면 발생일) 기준 */
export function costTotals(rs: Pick<RepairRecord, 'cost' | 'repairedDate' | 'occurredDate'>[], year: number): { year: number; all: number } {
  let y = 0, all = 0;
  for (const r of rs) {
    const c = r.cost ?? 0; all += c;
    const d = r.repairedDate || r.occurredDate;
    if (d && Number(d.slice(0, 4)) === year) y += c;
  }
  return { year: y, all };
}

/** 견적 비교: 최저가와 최고가 차이 */
export function compareQuotes(qs: Quote[]): { lowestId?: string; min?: number; max?: number; saving?: number } {
  const valid = qs.filter((q) => q.amount > 0);
  if (!valid.length) return {};
  const sorted = [...valid].sort((a, b) => a.amount - b.amount);
  const min = sorted[0].amount, max = sorted[sorted.length - 1].amount;
  return { lowestId: sorted[0].id, min, max, saving: valid.length > 1 ? max - min : undefined };
}

export function nextStage(s: RepairStage): RepairStage | null {
  const i = STAGE_ORDER.indexOf(s);
  return i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null;
}
