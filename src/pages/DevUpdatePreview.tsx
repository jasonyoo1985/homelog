import { useState } from 'react';
import { RELEASES } from '@/data/releases';
import { WhatsNewSheet } from '@/components/WhatsNewSheet';

/** 개발 전용: 구글 플레이가 없는 웹에서 '새 버전 확인 팝업' 모습을 확인하기 위한 화면 (배포 빌드에는 포함되지 않음) */
export function DevUpdatePreview() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button className="btn-soft" onClick={() => setOpen(true)}>업데이트 팝업 다시 열기</button>
      {open && <WhatsNewSheet mode="update" release={RELEASES[0]} onClose={() => setOpen(false)} onConfirm={() => setOpen(false)} />}
    </>
  );
}
