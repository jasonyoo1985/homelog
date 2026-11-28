import type { MaterialItem, RepairRecord } from '@/db/types';
import { dueInfo } from './dates';

export interface HealthInput {
  materials: Pick<MaterialItem, 'status' | 'lastMaintainedDate' | 'maintenanceCycleMonths'>[];
  repairs: Pick<RepairRecord, 'stage'>[];
  /** 이번 달 체크리스트 완료 비율 0~1 */
  checklistRatio: number;
}
export interface Health { score: number; label: string; parts: { care: number; repair: number; routine: number } }

/**
 * 집 건강 점수(0~100). 정보를 얼마나 채웠는지는 보지 않고, 실제로 챙길 일만 반영해요.
 * - 소모품 관리(40): 교체 주기가 지난 자재 비율만큼 감점 (주기를 정한 자재가 없으면 만점)
 * - 수리(30): 처리 중인 수리 1건당 10점 감점
 * - 이번 달 할 일(30): 체크리스트 완료 비율
 * 자재가 하나도 없으면 null
 */
export function computeHealth(i: HealthInput, now?: string): Health | null {
  if (i.materials.length === 0) return null;
  const withCycle = i.materials.filter((m) => m.maintenanceCycleMonths);
  const overdue = withCycle.filter((m) => dueInfo(m.lastMaintainedDate, m.maintenanceCycleMonths, now).state === 'overdue').length;
  const care = withCycle.length ? (1 - overdue / withCycle.length) * 40 : 40;
  const open = i.repairs.filter((r) => r.stage !== 'DONE').length;
  const repair = Math.max(0, 30 - open * 10);
  const routine = Math.min(1, Math.max(0, i.checklistRatio)) * 30;
  const score = Math.round(care + repair + routine);
  return { score, label: score >= 80 ? '좋아요' : score >= 60 ? '보통이에요' : '챙겨볼 때예요', parts: { care: Math.round(care), repair, routine: Math.round(routine) } };
}
