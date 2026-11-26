import { WARRANTY_GROUPS, type WarrantyGroup } from '@/data/warranty';
import { addMonths, daysBetween, today } from './dates';

export type WarrantyState = 'expired' | 'soon' | 'ok';
export interface WarrantyRow { group: WarrantyGroup; endDate: string; days: number; state: WarrantyState }

/** 기산일부터 공종별 만료일과 남은 일수 계산. 90일 이내면 'soon' */
export function computeWarranty(startISO: string, now: string = today(), groups: WarrantyGroup[] = WARRANTY_GROUPS): WarrantyRow[] {
  return groups
    .map((group) => {
      const endDate = addMonths(startISO, group.years * 12);
      const days = daysBetween(now, endDate);
      const state: WarrantyState = days < 0 ? 'expired' : days <= 90 ? 'soon' : 'ok';
      return { group, endDate, days, state };
    })
    .sort((a, b) => a.endDate.localeCompare(b.endDate));
}

export function warrantyLabel(r: Pick<WarrantyRow, 'days' | 'state'>): string {
  if (r.state === 'expired') return `${Math.abs(r.days)}일 전에 끝났어요`;
  return r.days === 0 ? '오늘까지예요' : `D-${r.days}`;
}
