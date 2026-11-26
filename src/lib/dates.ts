const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export const today = (): string => toISO(new Date());

function parse(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 월 말일을 넘지 않도록 보정 (1/31 + 1개월 = 2/28) */
export function addMonths(iso: string, months: number): string {
  const d = parse(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toISO(d);
}

export function daysBetween(fromISO: string, toISOStr: string): number {
  return Math.round((parse(toISOStr).getTime() - parse(fromISO).getTime()) / 86400000);
}

export type DueState = 'none' | 'noRecord' | 'overdue' | 'soon' | 'ok';
export interface DueInfo { state: DueState; nextDate?: string; days?: number }

/** 다음 교체/점검 예정일. 주기만 있고 최근 일자가 없으면 'noRecord' */
export function dueInfo(lastISO: string | undefined, cycleMonths: number | undefined, now = today()): DueInfo {
  if (!cycleMonths) return { state: 'none' };
  if (!lastISO) return { state: 'noRecord' };
  const nextDate = addMonths(lastISO, cycleMonths);
  const days = daysBetween(now, nextDate);
  return { state: days < 0 ? 'overdue' : days <= 30 ? 'soon' : 'ok', nextDate, days };
}

export function dueLabel(i: DueInfo): string {
  switch (i.state) {
    case 'overdue': return `교체 ${Math.abs(i.days!)}일 지남`;
    case 'soon': return i.days === 0 ? '오늘 교체' : `교체 D-${i.days}`;
    case 'ok': return `다음 교체 ${i.nextDate}`;
    case 'noRecord': return '교체일 미기록';
    default: return '';
  }
}
