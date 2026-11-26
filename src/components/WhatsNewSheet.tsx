import { useNavigate } from 'react-router-dom';
import { useBackClose } from '@/lib/useBackClose';
import { KIND_LABEL, type Release, type ReleaseItem } from '@/data/releases';

const TONE: Record<ReleaseItem['tone'], string> = {
  blue: 'from-[#8DBBFF] to-[#2878ED]',
  green: 'from-[#7BE0BC] to-[#20B486]',
  amber: 'from-[#FFD08A] to-[#F2A541]',
  rose: 'from-[#FF9FA8] to-[#E45D68]',
};
const BADGE: Record<ReleaseItem['kind'], string> = { new: 'badge-warn', better: 'badge-ok', fixed: 'bg-primary-100 text-primary' };

interface Props {
  release: Release;
  onClose: () => void;
  /** 'update'면 설치 전 확인 팝업: 바뀌는 내용을 보여 주고 [업데이트]/[나중에]를 묻는다 */
  mode?: 'whatsnew' | 'update';
  onConfirm?: () => void;
}

export function WhatsNewSheet({ release, onClose, mode = 'whatsnew', onConfirm }: Props) {
  const nav = useNavigate();
  const isUpdate = mode === 'update';
  useBackClose(true, onClose);
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" role="dialog" aria-modal="true" aria-label={isUpdate ? '새 버전 안내' : '새로 바뀐 점'}>
      <button className="anim-fade absolute inset-0 bg-navy/45 backdrop-blur-[2px]" onClick={onClose} aria-label="닫기" />
      <div className="anim-sheet relative flex max-h-[88%] w-full max-w-[480px] flex-col rounded-t-[28px] bg-[#FBFCFF] shadow-nav">
        <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-line" />
        <div className="overflow-y-auto px-5 pb-2 pt-4">
          <p className="text-sm font-bold text-primary">{isUpdate ? '새 버전이 나왔어요' : '새로 바뀐 점'}</p>
          <h2 className="mt-1 text-[24px] font-extrabold leading-tight tracking-tight">{release.title}</h2>
          <p className="mt-1.5 break-keep text-[15px] text-ink-sub">{release.subtitle}</p>

          <ul className="mt-5 flex flex-col gap-5">
            {release.items.map((it) => (
              <li key={it.title} className="flex gap-3.5">
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br ${TONE[it.tone]} text-[28px] shadow-float`} aria-hidden>
                  <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,.25)]">{it.emoji}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-keep text-[16px] font-bold">{it.title}</h3>
                    <span className={`badge !py-0.5 ${BADGE[it.kind]}`}>{KIND_LABEL[it.kind]}</span>
                  </div>
                  <p className="mt-1 break-keep text-[14px] leading-relaxed text-ink-sub">{it.desc}</p>
                  {it.cta && !isUpdate && (
                    <button className="chip mt-2 !text-primary" onClick={() => { onClose(); nav(it.cta!.to); }}>{it.cta.label}</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 justify-end gap-3 px-5 pt-3" style={{ paddingBottom: 'calc(20px + var(--safe-bottom))' }}>
          {isUpdate ? (
            <>
              <button className="btn-soft !px-6" onClick={onClose}>나중에</button>
              <button className="btn-3d !px-8" onClick={onConfirm}>업데이트</button>
            </>
          ) : (
            <button className="btn-3d !px-8" onClick={onClose}>닫기</button>
          )}
        </div>
      </div>
    </div>
  );
}
