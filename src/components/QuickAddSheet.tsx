import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

const ACTIONS: { label: string; sub: string; icon: IconName; to: string; tone: string }[] = [
  { label: '자재 추가', sub: '사진 먼저, 이름은 나중에', icon: 'box', to: '/materials', tone: 'from-primary-400 to-primary' },
  { label: '모르는 자재 찾기', sub: '라벨 사진으로 모델명 탐색', icon: 'search', to: '/materials', tone: 'from-[#7C8CF8] to-[#5565E8]' },
  { label: '수리/하자 기록', sub: '발견 → 진행 → 완료', icon: 'wrench', to: '/repairs', tone: 'from-[#F7B955] to-warn' },
  { label: '문서 추가', sub: '영수증·보증서·설명서', icon: 'folder', to: '/docs', tone: 'from-[#4FD1A5] to-ok' },
];

export function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="빠른 추가">
      <button className="anim-fade absolute inset-0 bg-navy/40 backdrop-blur-[2px]" onClick={onClose} aria-label="닫기" />
      <div className="anim-sheet relative w-full max-w-[480px] rounded-t-[28px] bg-bg px-4 pt-3"
        style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        <h2 className="mb-3 px-1 text-lg font-bold">무엇을 기록할까요?</h2>
        <div className="grid grid-cols-2 gap-3">
          {ACTIONS.map((a) => (
            <button key={a.label} className="card-3d-press flex flex-col items-start gap-2 p-4 text-left"
              onClick={() => { onClose(); nav(a.to); }}>
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${a.tone} text-white shadow-card-press`}>
                <Icon name={a.icon} />
              </span>
              <span className="text-[15px] font-bold">{a.label}</span>
              <span className="text-xs leading-snug text-ink-sub">{a.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
