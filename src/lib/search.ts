import type { MaterialItem } from '@/db/types';

/** 검색어: 브랜드 + (모델명 || 자재명). 외부 유료 API 없이 URL만 연다. */
export function searchQuery(m: Pick<MaterialItem, 'name' | 'brand' | 'modelName'>): string {
  return [m.brand, m.modelName || m.name].filter(Boolean).join(' ').trim();
}
export const naverUrl = (q: string) => `https://search.naver.com/search.naver?query=${encodeURIComponent(q)}`;
export const googleUrl = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
export const googleImageUrl = (q: string) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
export const googleLensUrl = 'https://lens.google.com/';
export const naverMapUrl = (q: string) => `https://map.naver.com/p/search/${encodeURIComponent(q)}`;

/** 관리사무소/시공사/제조사에 보낼 문의 문구 (사용자가 복사해서 사용) */
export function inquiryText(m: Pick<MaterialItem, 'name' | 'roomName' | 'brand' | 'modelName'>, houseName = '우리 집'): string {
  const lines = [
    '안녕하세요. 입주민입니다.',
    `${houseName} ${m.roomName}의 「${m.name}」 제품 정보를 확인하고 싶어 문의드립니다.`,
    '- 제조사/브랜드:',
    '- 모델명/품번:',
    '- 규격/색상:',
    '- 시공(설치) 시기:',
    '- 무상 보증 기간 및 A/S 접수처:',
    '확인되는 대로 회신 부탁드립니다. 감사합니다.',
  ];
  if (m.brand) lines[2] = `- 제조사/브랜드: ${m.brand} (맞는지 확인 부탁드립니다)`;
  if (m.modelName) lines[3] = `- 모델명/품번: ${m.modelName} (맞는지 확인 부탁드립니다)`;
  return lines.join('\n');
}
