import type { Release } from '@/data/releases';

const KEY_ID = 'homelog.whatsnew.seen';
const KEY_BUILD = 'homelog.whatsnew.build';

export function getSeen(): string | null {
  try { return localStorage.getItem(KEY_ID); } catch { return null; }
}
export function getSeenBuild(): number | null {
  try { const v = localStorage.getItem(KEY_BUILD); return v === null ? null : Number(v); } catch { return null; }
}
/** 안내를 본(또는 건너뛴) 상태를 기록: 어느 빌드까지 봤는지 + 호환용 id */
export function markSeen(latestId: string, build?: number): void {
  try {
    localStorage.setItem(KEY_ID, latestId);
    if (build !== undefined) localStorage.setItem(KEY_BUILD, String(build));
  } catch { /* 저장 불가 환경에서는 매번 보여주지 않도록 무시 */ }
}

let returning: boolean | undefined;
/** 앱 시작 직후(집 프로필을 만들기 전에) 한 번만 기록: 이전에 앱을 실행한 적이 있는 기기인가 */
export function setReturningUser(v: boolean): void { if (returning === undefined) returning = v; }
export const isReturningUser = (): boolean => returning === true;

/** 마지막으로 본 빌드. 예전 버전은 id만 저장했으므로 id로 빌드를 찾아 이어받는다. 본 적이 없으면 null */
export function sinceBuild(seenId: string | null, seenBuild: number | null, releases: Release[]): number | null {
  if (seenBuild !== null && Number.isFinite(seenBuild)) return seenBuild;
  if (seenId) return releases.find((r) => r.id === seenId)?.build ?? 0;
  return null;
}

/** since 이후 ~ 설치된 빌드까지의 안내(최신이 앞) */
export function pendingNotes(releases: Release[], since: number, installed: number): Release[] {
  return releases.filter((r) => r.build > since && r.build <= installed).sort((a, b) => b.build - a.build);
}

/** 여러 안내를 하나로 합친다: 제목은 최신, 항목은 최신부터 최대 maxItems개 */
export function mergeNotes(rs: Release[], maxItems = 8): Release | null {
  if (rs.length === 0) return null;
  const sorted = [...rs].sort((a, b) => b.build - a.build);
  const [newest] = sorted;
  return {
    ...newest,
    subtitle: sorted.length > 1 ? `${sorted.length}개 버전의 바뀐 내용을 모아 보여 드려요.` : newest.subtitle,
    items: sorted.flatMap((r) => r.items).slice(0, maxItems),
  };
}

/**
 * 업데이트 후 안내를 어떻게 할지:
 * - 'silent': 처음 설치한 기기 → 안내 없이 지금 빌드까지 본 것으로 기록
 * - 'show': 볼 안내가 있음   - 'hide': 볼 안내 없음
 * 이전에 앱을 쓴 적이 있는데 기록이 전혀 없으면(구버전) 최신 안내 1개를 보여준다
 */
export function decideWhatsNew(since: number | null, returningUser: boolean, releases: Release[], installed: number): { kind: 'silent' | 'show' | 'hide'; notes: Release | null } {
  if (since === null && !returningUser) return { kind: 'silent', notes: null };
  const pending = since === null
    ? releases.filter((r) => r.build <= installed).sort((a, b) => b.build - a.build).slice(0, 1)
    : pendingNotes(releases, since, installed);
  const notes = mergeNotes(pending);
  return notes ? { kind: 'show', notes } : { kind: 'hide', notes: null };
}
