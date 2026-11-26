const KEY = 'homelog.whatsnew.seen';

export function getSeen(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
export function markSeen(id: string): void {
  try { localStorage.setItem(KEY, id); } catch { /* 저장 불가 환경에서는 매번 보여주지 않도록 무시 */ }
}

let returning: boolean | undefined;
/** 앱 시작 직후(집 프로필을 만들기 전에) 한 번만 기록: 이전에 앱을 실행한 적이 있는 기기인가 */
export function setReturningUser(v: boolean): void { if (returning === undefined) returning = v; }
export const isReturningUser = (): boolean => returning === true;

/**
 * 업데이트 안내를 보여줄지 결정.
 * - 이미 본 안내면 숨김
 * - 처음 설치(이전 실행 기록 없음)면 안내 없이 조용히 '본 것'으로 처리
 * - 이전에 앱을 쓴 적이 있으면(데이터가 없어도) 보여줌
 */
export function shouldShowRelease(seen: string | null, latestId: string, returningUser: boolean): 'show' | 'hide' | 'silent' {
  if (seen === latestId) return 'hide';
  if (seen === null && !returningUser) return 'silent';
  return 'show';
}
