export type ID = string;

export type HousingType = '아파트' | '빌라' | '주택' | '오피스텔' | '기타';

export interface HouseProfile {
  id: ID;
  name: string;
  housingType: HousingType;
  areaPyeong?: number;
  moveInDate?: string; // YYYY-MM-DD
  builtYear?: number;
  rooms: string[];
  createdAt: number;
  updatedAt: number;
}

export const MATERIAL_CATEGORIES = [
  '바닥재/마루/타일',
  '벽지/도장',
  '주방설비',
  '욕실설비',
  '창호/방충망',
  '도어락/문',
  '수납/붙박이장',
  '보일러/환기',
  '에어컨/냉난방',
  '조명/전기',
  '기타',
] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

/** UNKNOWN=미확인, PARTIAL=일부확인, VERIFIED=확인완료 */
export type VerifyStatus = 'UNKNOWN' | 'PARTIAL' | 'VERIFIED';

/** 사진: 압축된 Blob + 목록용 썸네일 Blob (base64보다 용량 33% 절약) */
export interface StoredPhoto {
  id: ID;
  blob: Blob;
  thumb: Blob;
  width: number;
  height: number;
  createdAt: number;
}

export interface MaterialItem {
  id: ID;
  houseId: ID;
  roomName: string;
  category: MaterialCategory;
  name: string;
  brand?: string;
  modelName?: string;
  spec?: string;
  installedDate?: string;
  warrantyEndDate?: string;
  customerCenter?: string; // 사용자가 직접 입력한 A/S 메모 (앱이 임의 생성 금지)
  purchaseUrlOrNote?: string;
  status: VerifyStatus;
  photos: StoredPhoto[];
  maintenanceCycleMonths?: number;
  lastMaintainedDate?: string;
  discoveryNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export type IssueType = '파손' | '균열' | '누수' | '곰팡이' | '작동불량' | '소음/마모' | '소모품교체' | '기타';
export type RepairStage = 'FOUND' | 'IN_PROGRESS' | 'DONE';

export interface Quote { id: ID; vendor: string; amount: number; note?: string }

export interface RepairRecord {
  id: ID;
  houseId: ID;
  materialId?: ID;
  roomName: string;
  title: string;
  issueType: IssueType;
  stage: RepairStage;
  occurredDate: string;
  repairedDate?: string;
  providerName?: string; // 업체명 또는 '자가수리'
  cost?: number; // 원
  beforeAfterNotes?: string;
  quotes?: Quote[]; // 견적 비교(사용자가 직접 입력)
  photos: StoredPhoto[];
  createdAt: number;
  updatedAt: number;
}

export type DocType = '분양/매매계약서' | '옵션계약서' | '마감재리스트' | '보증서' | '설명서' | '수리영수증' | '기타';

export interface DocumentItem {
  id: ID;
  houseId: ID;
  title: string;
  docType: DocType;
  linkedMaterialIds: ID[];
  memo?: string;
  externalLink?: string;
  attachments: StoredPhoto[];
  createdAt: number;
  updatedAt: number;
}

/** 시안의 추가 콘텐츠용 (공과금 기록, 체크리스트 완료, 배지) */
export interface UtilityRecord {
  id: ID;
  houseId: ID;
  month: string; // YYYY-MM
  kind: '관리비' | '전기' | '가스' | '수도' | '기타';
  amount: number;
  createdAt: number;
}

export interface ChecklistDone {
  id: string; // `${month}:${taskKey}`
  month: string;
  taskKey: string;
  doneAt: number;
}

export type ContactCategory = '제조사 A/S' | '시공·인테리어' | '설비·수리' | '관리사무소' | '기타';
/** 사용자가 직접 저장하는 업체 연락처 (앱이 임의로 만들지 않음) */
export interface ContactItem {
  id: ID;
  houseId: ID;
  name: string;
  category: ContactCategory;
  phone?: string;
  memo?: string;
  materialId?: ID;
  createdAt: number;
  updatedAt: number;
}

export type InspectState = 'TODO' | 'OK' | 'ISSUE';
/** 입주 점검 항목별 결과 */
export interface InspectionItem {
  id: string; // `${houseId}:${key}`
  houseId: ID;
  key: string;
  state: InspectState;
  note?: string;
  photos: StoredPhoto[];
  updatedAt: number;
}

export interface Setting {
  key: string;
  value: unknown;
}
