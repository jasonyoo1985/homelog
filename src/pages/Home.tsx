import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '@/db/db';
import { Icon } from '@/components/Icon';
import { Loading } from '@/components/EmptyState';

export function Home() {
  const stats = useLiveQuery(async () => {
    const [total, needCheck, progress] = await Promise.all([
      db.materials.count(),
      db.materials.where('status').notEqual('VERIFIED').count(),
      db.repairs.where('stage').notEqual('DONE').count(),
    ]);
    return { total, needCheck, progress };
  }, []);
  const house = useLiveQuery(() => db.houses.toCollection().first(), []);

  if (!stats) return <Loading />;
  const cards = [
    { label: '전체 자재', value: stats.total, to: '/materials', icon: 'box' as const, cls: 'text-primary bg-primary-100' },
    { label: '확인 필요', value: stats.needCheck, to: '/materials', icon: 'alert' as const, cls: 'text-danger bg-danger-bg' },
    { label: '진행 중 수리', value: stats.progress, to: '/repairs', icon: 'wrench' as const, cls: 'text-warn bg-warn-bg' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-extrabold text-navy">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-grad-primary text-white shadow-card-press"><Icon name="home" size={20} /></span>
          HOMELOG
        </div>
        <button className="card-3d-press flex h-10 w-10 items-center justify-center" aria-label="알림"><Icon name="bell" size={20} /></button>
      </div>

      <section className="relative overflow-hidden rounded-xl2 bg-grad-hero p-5 text-white shadow-float">
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <p className="text-sm text-white/70">{house?.name ?? '우리 집'}</p>
        <h2 className="mt-1 text-[22px] font-extrabold leading-snug">우리 집,<br />지금도 안전한가요?</h2>
        <p className="mt-2 text-xs text-white/70">홈로그가 꼼꼼하게 관리해드려요</p>
        <Link to="/materials" className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-navy shadow-card-press">
          자세히 보기 <Icon name="chevron" size={16} />
        </Link>
      </section>

      <section>
        <h3 className="mb-3 text-base font-bold">우리 집 현황</h3>
        <div className="grid grid-cols-3 gap-3">
          {cards.map((c) => (
            <Link key={c.label} to={c.to} className="card-3d-press flex flex-col items-center gap-2 py-4">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${c.cls}`}><Icon name={c.icon} /></span>
              <span className="text-xs text-ink-sub">{c.label}</span>
              <span className="text-xl font-extrabold">{c.value}<span className="text-sm font-semibold text-ink-sub">개</span></span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
