import data from './releases.json';

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
  /** 이 안내가 속한 앱 빌드 번호(versionCode). app-version.json과 같은 값으로 증가 */
  build: number;
  title: string;
  subtitle: string;
  items: ReleaseItem[];
}

export const KIND_LABEL: Record<NoteKind, string> = { new: '새로워요', better: '좋아졌어요', fixed: '고쳤어요' };

/**
 * 릴리스 노트 원본은 releases.json 한 곳. 같은 내용을 docs/releases.json(웹 공개본)에도 복사해 두며,
 * 앱은 실행 시 웹 공개본을 읽어 '업데이트 전' 안내에 사용한다. (두 파일이 같은지는 테스트가 확인)
 * 최신 안내가 맨 앞.
 */
export const RELEASES: Release[] = (data as { releases: Release[] }).releases;

export const LATEST = RELEASES[0];
