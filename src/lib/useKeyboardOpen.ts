import { useEffect, useState } from 'react';

const NON_TEXT = ['checkbox', 'radio', 'button', 'submit', 'file', 'range', 'color'];
const isField = (t: EventTarget | null): boolean =>
  t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !NON_TEXT.includes((t as HTMLInputElement).type);

/** 입력 칸에 포커스가 있는 동안(키보드가 열린 동안) true. 하단 메뉴가 입력 칸을 가리지 않게 숨기는 데 쓴다 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = (e: FocusEvent) => { if (isField(e.target)) setOpen(true); };
    const off = () => setTimeout(() => { if (!isField(document.activeElement)) setOpen(false); }, 120);
    document.addEventListener('focusin', on);
    document.addEventListener('focusout', off);
    return () => { document.removeEventListener('focusin', on); document.removeEventListener('focusout', off); };
  }, []);
  return open;
}
