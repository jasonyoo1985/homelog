export type NoteKind = 'new' | 'better' | 'fixed';

export interface ReleaseItem {
  emoji: string;
  tone: 'blue' | 'green' | 'amber' | 'rose';
  kind: NoteKind;
  title: string;
  desc: string;
  cta?: { label: string; to: string };
}

export interface Release {
  /** 앱을 업데이트한 사용자에게 한 번만 보여주는 식별자 (새 안내를 만들면 값을 바꾼다) */
  id: string;
  title: string;
  subtitle: string;
  items: ReleaseItem[];
}

export const KIND_LABEL: Record<NoteKind, string> = { new: '새로워요', better: '좋아졌어요', fixed: '고쳤어요' };

/** 최신 안내가 맨 앞 */
export const RELEASES: Release[] = [
  {
    id: '2026-11-materials',
    title: '자재관리가 생겼어요',
    subtitle: '쓰던 대로 쓰셔도 돼요. 필요할 때 골라 쓰는 기능이에요.',
    items: [
      {
        emoji: '🏠', tone: 'blue', kind: 'new', title: '표준 자재 25종, 한 번에',
        desc: '거실 마루부터 보일러까지 우리 집에 있을 법한 자재를 미리 만들어 드려요. 아는 것만 채워도 충분해요.',
        cta: { label: '지금 해보기', to: '/materials' },
      },
      {
        emoji: '🔍', tone: 'green', kind: 'new', title: '모르는 자재 찾기',
        desc: '라벨 사진을 찍어 두면 모델명 검색부터 관리사무소에 보낼 문의 문구 복사까지 도와드려요.',
        cta: { label: '자재 보러 가기', to: '/materials' },
      },
      {
        emoji: '⏰', tone: 'amber', kind: 'new', title: '교체 시기를 챙겨 드려요',
        desc: "에어컨 필터, 도어락 건전지처럼 주기가 있는 건 '오늘 교체 완료'만 누르세요. 다음 날짜는 알아서 계산해요.",
        cta: { label: '교체 임박 보기', to: '/materials?status=due' },
      },
      {
        emoji: '🛠️', tone: 'rose', kind: 'fixed', title: '화면이 멈추던 문제를 고쳤어요',
        desc: '자재관리가 열리지 않던 문제를 해결했고, 문제가 생겨도 안내 화면이 나와요.',
      },
    ],
  },
];

export const LATEST = RELEASES[0];
