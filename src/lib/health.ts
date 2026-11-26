import type { MaterialItem, RepairRecord } from '@/db/types';
import { dueInfo } from './dates';

export interface HealthInput {
  materials: Pick<MaterialItem, 'status' | 'lastMaintainedDate' | 'maintenanceCycleMonths'>[];
  repairs: Pick<RepairRecord, 'stage'>[];
  /** 이번 달 체크리스트 완료 비율 0~1 */
  checklistRatio: number;
}
export interface Health { score: number; label: string; parts: { info: number; care: number; repair: number; routine: number } }

/**
 * 집 건강 점수(0~100). 네 가지를 합쳐요.
 * - 정보 확인(40): 확인완료 1점, 일부확인 0.5점
 * - 소모품 관리(30): 교체 주기가 지난 자재 비율만큼 감점 (주기를 정한 자재가 없으면 만점)
 * - 수리(15): 처리 중인 수리 1건당 5점 감점
 * - 이번 달 할 일(15): 체크리스트 완료 비율
 * 자재가 하나도 없으면 null
 */
export function computeHealth(i: HealthInput, now?: string): Health | null {
  const n = i.materials.length;
  if (n === 0) return null;
  const info = (i.materials.reduce((a, m) => a + (m.status === 'VERIFIED' ? 1 : m.status === 'PARTIAL' ? 0.5 : 0), 0) / n) * 40;
  const withCycle = i.materials.filter((m) => m.maintenanceCycleMonths);
  const overdue = withCycle.filter((m) => dueInfo(m.lastMaintainedDate, m.maintenanceCycleMonths, now).state === 'overdue').length;
  const care = withCycle.length ? (1 - overdue / withCycle.length) * 30 : 30;
  const open = i.repairs.filter((r) => r.stage !== 'DONE').length;
  const repair = Math.max(0, 15 - open * 5);
  const routine = Math.min(1, Math.max(0, i.checklistRatio)) * 15;
  const score = Math.round(info + care + repair + routine);
  return { score, label: score >= 80 ? '좋아요' : score >= 60 ? '보통이에요' : '챙겨볼 때예요', parts: { info: Math.round(info), care: Math.round(care), repair, routine: Math.round(routine) } };
}
