import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

const LEFT: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: '홈', icon: 'home' },
  { to: '/materials', label: '자재관리', icon: 'box' },
];
const RIGHT: { to: string; label: string; icon: IconName }[] = [
  { to: '/repairs', label: '수리이력', icon: 'wrench' },
  { to: '/docs', label: '문서함', icon: 'folder' },
];

function Tab({ to, label, icon }: { to: string; label: string; icon: IconName }) {
  return (
    <NavLink to={to} end={to === '/'} aria-label={label}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-1 pt-2 text-[11px] font-semibold transition ${isActive ? 'text-primary' : 'text-ink-sub'}`}>
      {({ isActive }) => (
        <>
          <span className={`flex h-8 w-12 items-center justify-center rounded-2xl transition ${isActive ? 'bg-primary-100 shadow-card-press' : ''}`}>
            <Icon name={icon} />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

export function BottomNav({ onQuickAdd }: { onQuickAdd: () => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] rounded-t-[26px] border-t border-white bg-white/90 shadow-nav backdrop-blur-md"
      style={{ paddingBottom: 'var(--safe-bottom)' }} aria-label="하단 메뉴">
      <div className="flex items-start px-2 pb-2">
        {LEFT.map((t) => <Tab key={t.to} {...t} />)}
        <div className="flex w-20 justify-center">
          <button onClick={onQuickAdd} aria-label="빠른 추가"
            className="btn-3d -mt-6 flex h-14 w-14 items-center justify-center !rounded-full !p-0 ring-4 ring-bg">
            <Icon name="plus" size={26} strokeWidth={2.6} />
          </button>
        </div>
        {RIGHT.map((t) => <Tab key={t.to} {...t} />)}
      </div>
    </nav>
  );
}
