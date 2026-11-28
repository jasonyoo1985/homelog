import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

export function Docs() {
  return (
    <>
      <PageHeader title="문서함" sub="보증서·설명서·영수증을 보관하는 곳" />
      <EmptyState title="문서 보관 기능은 준비 중이에요" desc="지금은 자재 카드의 '사진'에 보증서나 라벨을 찍어 두면 같은 효과를 낼 수 있어요. 기록은 아래에서 파일로 백업할 수 있어요." />
      <Link to="/backup" className="card-3d-press mt-4 flex items-center justify-between p-4">
        <span><span className="block text-sm font-bold">가져오기 · 내보내기</span><span className="block text-xs text-ink-sub">백업 파일과 마감재 리스트를 불러오거나 저장해요</span></span>
        <span className="text-primary">›</span>
      </Link>
    </>
  );
}
