import type { MaterialItem } from '@/db/types';
import { addMonths, dueInfo, today } from './dates';
import { computeWarranty } from './warranty';
import { tasksForMonth } from '@/data/monthly';

export interface Reminder { id: number; at: Date; title: string; body: string; route: string }

/** 문자열 → 양의 정수 id (같은 알림은 항상 같은 id) */
export function hashId(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 2147483000 + 1;
}

const at = (iso: string, hour: number): Date => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d, hour, 0, 0); };
const shift = (iso: string, days: number): string => { const [y, m, d] = iso.split('-').map(Number); const t = new Date(y, m - 1, d + days); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };

export interface ReminderInput {
  materials: Pick<MaterialItem, 'id' | 'name' | 'lastMaintainedDate' | 'maintenanceCycleMonths'>[];
  warrantyStart?: string;
  now?: Date;
  limit?: number;
}

/** 앞으로 보낼 알림 목록. 교체일 3일 전·당일, 하자 보증 90일·30일 전, 매월 1일 할 일 안내 */
export function buildReminders({ materials, warrantyStart, now = new Date(), limit = 50 }: ReminderInput): Reminder[] {
  const out: Reminder[] = [];
  const push = (key: string, when: Date, title: string, body: string, route: string) => { if (when.getTime() > now.getTime()) out.push({ id: hashId(key), at: when, title, body, route }); };
  const todayIso = today();

  for (const m of materials) {
    const due = dueInfo(m.lastMaintainedDate, m.maintenanceCycleMonths, todayIso);
    if (!due.nextDate) continue;
    push(`due3:${m.id}:${due.nextDate}`, at(shift(due.nextDate, -3), 9), '곧 교체할 때예요', `${m.name} 교체·점검일이 3일 남았어요.`, `/materials/${m.id}`);
    push(`due0:${m.id}:${due.nextDate}`, at(due.nextDate, 9), '오늘 교체·점검일이에요', `${m.name}을(를) 확인해 보세요.`, `/materials/${m.id}`);
  }
  if (warrantyStart) {
    for (const r of computeWarranty(warrantyStart, todayIso)) {
      for (const d of [90, 30]) push(`war${d}:${r.group.id}:${r.endDate}`, at(shift(r.endDate, -d), 10), '하자 보증이 곧 끝나요', `${r.group.name} 보증이 약 ${d}일 뒤 끝나요. 이상이 있으면 지금 접수하세요.`, '/warranty');
    }
  }
  for (let i = 0; i < 4; i++) {
    const first = addMonths(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, i);
    const month = Number(first.slice(5, 7));
    push(`month:${first}`, at(first, 10), `${month}월 집 관리`, `이번 달 챙길 일이 ${tasksForMonth(month).length}가지 있어요.`, '/checklist');
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, limit);
}
