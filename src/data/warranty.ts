/**
 * 공동주택 하자담보책임기간 (공동주택관리법 시행령 제36조 기준의 요약).
 * 설명 문구는 이해하기 쉽게 풀어 쓴 것이며, 실제 적용 기간과 기산일은 품질보증서·입주 안내문으로 반드시 확인하세요.
 */
export interface WarrantyGroup { id: string; years: 2 | 3 | 5 | 10; name: string; examples: string }

export const WARRANTY_GROUPS: WarrantyGroup[] = [
  { id: 'finish', years: 2, name: '마감공사', examples: '미장, 도배, 도장, 타일, 내부 석공사, 붙박이·주방가구, 가전제품' },
  { id: 'heating', years: 3, name: '난방·냉방·환기 설비', examples: '보일러, 온돌(바닥난방), 배관, 시스템에어컨, 환기장치, 온도조절기' },
  { id: 'plumbing', years: 3, name: '급수·배수·위생 설비', examples: '수전, 양변기, 세면대, 샤워기, 배수관, 온수 설비' },
  { id: 'gas', years: 3, name: '가스설비', examples: '가스 배관, 가스 설비' },
  { id: 'window', years: 3, name: '창호공사', examples: '창문틀, 창호 철물, 유리, 방충망' },
  { id: 'wood', years: 3, name: '목공사', examples: '방문, 문틀, 몰딩 등 목재 구조·마감' },
  { id: 'electric', years: 3, name: '전기·조명 설비', examples: '배선, 분전반, 스위치·콘센트, 조명기구' },
  { id: 'telecom', years: 3, name: '정보통신·홈네트워크', examples: '월패드, 현관 카메라폰, 통신 배선, 세대 단자함' },
  { id: 'fire', years: 3, name: '소방시설', examples: '감지기, 스프링클러, 피난 설비' },
  { id: 'insulation', years: 3, name: '단열공사', examples: '벽체·천장·바닥 단열' },
  { id: 'misc', years: 3, name: '잡공사·조경', examples: '옥내외 설비, 조경 시설' },
  { id: 'structure', years: 5, name: '구조·방수·지붕', examples: '철근콘크리트, 철골, 조적, 지붕, 방수(누수 포함)' },
  { id: 'ground', years: 10, name: '지반공사(기초·지정)', examples: '건물 기초, 지반 공사' },
];
