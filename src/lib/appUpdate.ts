import { Capacitor } from '@capacitor/core';
import { AppUpdate, AppUpdateAvailability, type AppUpdateInfo } from '@capawesome/capacitor-app-update';

export type UpdateAction = 'immediate' | 'flexible' | 'none';

/** 구글 플레이 인앱 업데이트 정보로 실행할 방식을 결정 (순수 함수) */
export function decideUpdate(info: Pick<AppUpdateInfo, 'updateAvailability' | 'immediateUpdateAllowed' | 'flexibleUpdateAllowed'>): UpdateAction {
  const pending = info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE
    || info.updateAvailability === AppUpdateAvailability.UPDATE_IN_PROGRESS;
  if (!pending) return 'none';
  if (info.immediateUpdateAllowed) return 'immediate';
  if (info.flexibleUpdateAllowed) return 'flexible';
  return 'none';
}

/**
 * 앱을 열 때 새 버전이 있으면 업데이트를 진행한다.
 * - 즉시: 구글 플레이 화면에서 받고 설치한 뒤 자동으로 앱을 다시 연다.
 * - 유연: 백그라운드로 내려받고, 앱을 다시 열 때 적용된다.
 * 웹/개발 환경이나 플레이 스토어로 설치하지 않은 경우에는 조용히 건너뛴다.
 */
export async function checkForAppUpdate(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const action = decideUpdate(await AppUpdate.getAppUpdateInfo());
    if (action === 'immediate') await AppUpdate.performImmediateUpdate();
    else if (action === 'flexible') await AppUpdate.startFlexibleUpdate();
  } catch {
    // 오프라인이거나 플레이 스토어 설치본이 아니면 실패하는 것이 정상이므로 무시
  }
}
