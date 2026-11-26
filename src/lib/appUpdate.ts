import { Capacitor } from '@capacitor/core';
import { AppUpdate, AppUpdateAvailability, type AppUpdateInfo } from '@capawesome/capacitor-app-update';
import type { Release } from '@/data/releases';
import { mergeNotes } from './whatsnew';

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
  if (!r || !isStr(r.id) || !isStr(r.title) || !isStr(r.subtitle) || !Array.isArray(r.items) || !Number.isInteger(r.build)) return null;
  const tones = ['blue', 'green', 'amber', 'rose'], kinds = ['new', 'better', 'fixed'];
  const items = r.items.flatMap((it) => {
    if (!it || !isStr(it.emoji) || !isStr(it.title) || !isStr(it.desc) || !tones.includes(it.tone) || !kinds.includes(it.kind)) return [];
    return [{ emoji: it.emoji, tone: it.tone, kind: it.kind, title: it.title, desc: it.desc }];
  });
  return { id: r.id, build: r.build as number, title: r.title, subtitle: r.subtitle, items };
}

/**
 * 웹 공개본에서 '지금 설치된 앱보다 새로운(빌드 번호가 큰)' 안내를 모아 하나로 돌려준다.
 * 새 안내가 없으면 null.
 */
export function pickRemoteRelease(remote: unknown, installedBuild: number): Release | null {
  const list = (remote as { releases?: unknown[] } | null)?.releases;
  if (!Array.isArray(list)) return null;
  const newer = list.map(parseRelease).filter((x): x is Release => !!x && x.build > installedBuild);
  return mergeNotes(newer);
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
export async function planAppUpdate(installedBuild: number): Promise<UpdatePlan | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const action = decideUpdate(await AppUpdate.getAppUpdateInfo());
    if (action === 'none') return null;
    const release = pickRemoteRelease(await fetchRemoteReleases(), installedBuild);
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

const AVAIL_LABEL: Record<number, string> = { 0: '알 수 없음', 1: '새 버전 없음', 2: '새 버전 있음', 3: '업데이트 진행 중' };

/** 설정 화면의 '업데이트 확인'용: 구글 플레이가 지금 무엇을 알려 주는지 사람이 읽을 수 있게 정리한다 */
export async function diagnoseUpdate(): Promise<{ ok: boolean; lines: string[]; hint?: string }> {
  if (!Capacitor.isNativePlatform()) return { ok: false, lines: ['웹 화면에서는 확인할 수 없어요. 폰에 설치한 앱에서 눌러 주세요.'] };
  try {
    const i = await AppUpdate.getAppUpdateInfo();
    const lines = [
      `설치된 버전 코드: ${i.currentVersionCode}`,
      `플레이가 아는 최신 버전 코드: ${i.availableVersionCode ?? '아직 알려 주지 않음'}`,
      `상태: ${AVAIL_LABEL[i.updateAvailability] ?? i.updateAvailability}`,
      `즉시 업데이트 가능: ${i.immediateUpdateAllowed ? '예' : '아니요'} / 백그라운드 업데이트 가능: ${i.flexibleUpdateAllowed ? '예' : '아니요'}`,
    ];
    const none = i.updateAvailability === AppUpdateAvailability.UPDATE_NOT_AVAILABLE;
    return { ok: true, lines, hint: none ? '플레이가 아직 새 버전을 모르는 상태예요. Play 스토어에서 앱 페이지를 열어 업데이트를 확인하면 곧 반영돼요.' : undefined };
  } catch (e) {
    return {
      ok: false,
      lines: ['구글 플레이에서 정보를 가져오지 못했어요.', String((e as Error)?.message ?? e)],
      hint: 'Play 스토어(내부 테스트 링크)로 설치한 앱이 아니면 이 기능을 쓸 수 없어요. 직접 설치한 파일(APK)로는 동작하지 않아요.',
    };
  }
}

/** Play 스토어의 이 앱 페이지를 연다 (여기서 업데이트를 직접 받을 수 있다) */
export async function openStorePage(): Promise<void> {
  try { await AppUpdate.openAppStore(); } catch { /* 스토어 앱이 없으면 무시 */ }
}
