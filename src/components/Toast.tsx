import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type Kind = 'ok' | 'error' | 'info';
interface ToastItem { id: number; msg: string; kind: Kind }
interface ToastApi { show: (msg: string, kind?: Kind) => void }

const Ctx = createContext<ToastApi>({ show: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const show = useCallback((msg: string, kind: Kind = 'ok') => {
    const id = ++seq.current;
    setItems((a) => [...a, { id, msg, kind }]);
    setTimeout(() => setItems((a) => a.filter((t) => t.id !== id)), 2400);
  }, []);
  const api = useMemo(() => ({ show }), [show]);
  const dot = { ok: 'bg-ok', error: 'bg-danger', info: 'bg-primary' } as const;
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4"
        style={{ bottom: 'calc(96px + var(--safe-bottom))' }} role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="anim-toast flex items-center gap-2 rounded-2xl bg-navy px-4 py-3 text-sm font-medium text-white shadow-float">
            <span className={`h-2 w-2 rounded-full ${dot[t.kind]}`} />
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
