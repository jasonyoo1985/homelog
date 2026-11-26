import { Capacitor } from '@capacitor/core';
import { AppUpdate, AppUpdateAvailability, type AppUpdateInfo } from '@capawesome/capacitor-app-update';
import type { Release } from '@/data/releases';

export type UpdateAction = 'immediate' | 'flexible' | 'none';

/** 새 버전 안내문(릴리스 노트)을 공개하는 주소. 정적 파일 하나만 읽는다. */
export const RELEASES_URL = 'https://homelog.stackupinfra.com/releases.json';

/** 구글 플레이 인앱 업데이트 정보로 실행할 방식을 결정 (순수 함수) */
export function decideUpdate(info: Pick<AppUpdateInfo, 'updateAvailability' | 'immediateUpdateAllowed' | 'flexibleUpdateAllowed'>): UpdateAction {
  const pending = info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE
    || info.updateAvailability === AppUpdateAvailability.UPDATE_IN_PROGRESS;
  if (!pending) return 'none';
  if (info.immediateUpdateAllowed) return 'immediate';
  if (info.flexibleUpdateAllowed) return 'flexible';
  return 'none';
}

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length < 500;

/** 웹에서 받은 값을 검증하며 Release로 변환. 형식이 틀리면 null (외부 입력이므로 신뢰하지 않는다) */
export function parseRelease(v: unknown): Release | null {
  const r = v as Partial<Release> | null;
  if (!r || !isStr(r.id) || !isStr(r.title) || !isStr(r.subtitle) || !Array.isArray(r.items)) return null;
  const tones = ['blue', 'green', 'amber', 'rose'], kinds = ['new', 'better', 'fixed'];
  const items = r.items.flatMap((it) => {
    if (!it || !isStr(it.emoji) || !isStr(it.title) || !isStr(it.desc) || !tones.includes(it.tone) || !kinds.includes(it.kind)) return [];
    return [{ emoji: it.emoji, tone: it.tone, kind: it.kind, title: it.title, desc: it.desc }];
  });
  return { id: r.id, title: r.title, subtitle: r.subtitle, items };
}

/**
 * 웹 공개본에서 '지금 설치된 앱보다 새로운' 안내를 고른다.
 * 가장 앞(최신) 안내가 설치된 앱의 최신 안내와 같으면 새 안내가 없는 것이므로 null.
 */
export function pickRemoteRelease(remote: unknown, installedLatestId: string): Release | null {
  const list = (remote as { releases?: unknown[] } | null)?.releases;
  if (!Array.isArray(list) || list.length === 0) return null;
  const first = parseRelease(list[0]);
  return first && first.id !== installedLatestId ? first : null;
}

async function fetchRemoteReleases(timeoutMs = 4000): Promise<unknown> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${RELEASES_URL}?t=${Date.now()}`, { cache: 'no-store', signal: ctl.signal });
    return res.ok ? await res.json() : null;
  } catch { return null; } finally { clearTimeout(timer); }
}

export interface UpdatePlan { action: Exclude<UpdateAction, 'none'>; release: Release | null }

/**
 * 앱을 열 때 호출. 구글 플레이에 새 버전이 있으면 어떻게 업데이트할지와, 있다면 새 버전의 안내문을 돌려준다.
 * 아무것도 설치하지 않는다(설치는 사용자가 [업데이트]를 눌렀을 때 runAppUpdate).
 * 웹/개발 환경이나 플레이 스토어 설치본이 아니면 null.
 */
export async function planAppUpdate(installedLatestId: string): Promise<UpdatePlan | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const action = decideUpdate(await AppUpdate.getAppUpdateInfo());
    if (action === 'none') return null;
    const release = pickRemoteRelease(await fetchRemoteReleases(), installedLatestId);
    return { action, release };
  } catch {
    return null; // 오프라인이거나 플레이 스토어 설치본이 아니면 실패하는 것이 정상
  }
}

/** 사용자가 [업데이트]를 눌렀을 때: 즉시 방식은 설치 후 앱이 다시 열리고, 유연 방식은 백그라운드로 받는다 */
export async function runAppUpdate(action: UpdatePlan['action']): Promise<void> {
  try {
    if (action === 'immediate') await AppUpdate.performImmediateUpdate();
    else await AppUpdate.startFlexibleUpdate();
  } catch { /* 사용자가 취소하면 오류가 날 수 있으며, 다음에 앱을 열 때 다시 안내한다 */ }
}
