import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

export function Materials() {
  return (
    <>
      <PageHeader title="자재관리" sub="집 안의 모든 자재와 제품을 체계적으로 기록하세요" />
      <EmptyState title="아직 기록이 없어요" desc="다음 단계에서 이 화면을 완성합니다." />
    </>
  );
}
