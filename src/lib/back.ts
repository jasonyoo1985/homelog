/**
 * 뒤로가기 처리용 '닫기 스택'. 시트/팝업이 열릴 때 닫기 함수를 등록하면,
 * 하드웨어 뒤로가기 버튼이 페이지 이동보다 먼저 이것들을 닫는다.
 */
const stack: Array<() => void> = [];

export function pushBack(fn: () => void): () => void {
  stack.push(fn);
  return () => { const i = stack.lastIndexOf(fn); if (i >= 0) stack.splice(i, 1); };
}
/** 열려 있던 팝업을 하나 닫았으면 true */
export function popBack(): boolean {
  const fn = stack.pop();
  if (!fn) return false;
  fn();
  return true;
}

export type BackAction = { type: 'navigate'; to: string | -1 } | { type: 'exit-prompt' } | { type: 'exit' };
export const TAB_ROUTES = ['/', '/materials', '/repairs', '/docs'];

/**
 * 현재 경로와 직전 뒤로가기 시각으로 동작 결정 (순수 함수)
 * - 하위 화면 → 바로 전 화면(기록이 없으면 상위 탭)
 * - 홈이 아닌 탭 → 홈
 * - 홈 → 2초 안에 한 번 더 누르면 종료
 */
export function decideBack(path: string, canGoBack: boolean, lastBackAt: number, now: number): BackAction {
  if (path === '/') return now - lastBackAt < 2000 ? { type: 'exit' } : { type: 'exit-prompt' };
  if (TAB_ROUTES.includes(path)) return { type: 'navigate', to: '/' };
  if (canGoBack) return { type: 'navigate', to: -1 };
  const parent = TAB_ROUTES.find((t) => t !== '/' && path.startsWith(t + '/'));
  return { type: 'navigate', to: parent ?? '/' };
}
