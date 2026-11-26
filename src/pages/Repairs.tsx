import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

export function Repairs() {
  return (
    <>
      <PageHeader title="수리이력" sub="발생부터 처리까지 이력으로 관리하세요" />
      <EmptyState title="아직 기록이 없어요" desc="다음 단계에서 이 화면을 완성합니다." />
    </>
  );
}
