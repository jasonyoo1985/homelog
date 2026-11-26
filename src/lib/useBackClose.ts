import { useEffect } from 'react';
import { pushBack } from './back';

/** 시트/팝업이 열려 있는 동안 하드웨어 뒤로가기로 닫히게 한다 */
export function useBackClose(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open) return;
    return pushBack(onClose);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
