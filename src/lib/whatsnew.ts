const KEY = 'homelog.whatsnew.seen';

export function getSeen(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
export function markSeen(id: string): void {
  try { localStorage.setItem(KEY, id); } catch { /* 저장 불가 환경에서는 매번 보여주지 않도록 무시 */ }
}

/**
 * 업데이트 안내를 보여줄지 결정.
 * - 이미 본 안내면 숨김
 * - 처음 설치(저장된 기록이 하나도 없음)면 안내 없이 조용히 '본 것'으로 처리
 */
export function shouldShowRelease(seen: string | null, latestId: string, hasData: boolean): 'show' | 'hide' | 'silent' {
  if (seen === latestId) return 'hide';
  if (seen === null && !hasData) return 'silent';
  return 'show';
}
