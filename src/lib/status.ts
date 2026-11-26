import type { MaterialItem, VerifyStatus } from '@/db/types';

type Fields = Pick<MaterialItem, 'brand' | 'modelName' | 'spec' | 'installedDate' | 'photos'>;

/** 입력 부담을 줄이기 위해 상태는 자동 계산: 브랜드+모델명=확인완료, 일부 입력=일부확인, 없음=미확인 */
export function deriveStatus(m: Fields): VerifyStatus {
  if (m.brand?.trim() && m.modelName?.trim()) return 'VERIFIED';
  if (m.brand?.trim() || m.modelName?.trim() || m.spec?.trim() || m.installedDate || m.photos.length > 0) return 'PARTIAL';
  return 'UNKNOWN';
}

export const STATUS_LABEL: Record<VerifyStatus, string> = { UNKNOWN: '미확인', PARTIAL: '일부확인', VERIFIED: '확인완료' };
export const STATUS_CLASS: Record<VerifyStatus, string> = { UNKNOWN: 'badge-danger', PARTIAL: 'badge-warn', VERIFIED: 'badge-ok' };
