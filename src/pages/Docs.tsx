import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

export function Docs() {
  return (
    <>
      <PageHeader title="문서함" sub="계약서부터 영수증까지 한곳에 보관하세요" />
      <EmptyState title="아직 기록이 없어요" desc="다음 단계에서 이 화면을 완성합니다." />
    </>
  );
}
