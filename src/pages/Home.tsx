import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '@/db/db';
import { Icon } from '@/components/Icon';
import { Loading } from '@/components/EmptyState';
import { dueInfo, dueLabel, daysBetween, today } from '@/lib/dates';

interface Alert { id: string; title: string; msg: string; tone: 'danger' | 'warn' | 'info' }

export function Home() {
  const data = useLiveQuery(async () => {
    const [materials, repairs] = await Promise.all([db.materials.toArray(), db.repairs.toArray()]);
    const now = today();
    const alerts: Alert[] = [];
    for (const m of materials) {
      const due = dueInfo(m.lastMaintainedDate, m.maintenanceCycleMonths, now);
      if (due.state === 'overdue') alerts.push({ id: m.id, title: m.name, msg: dueLabel(due), tone: 'danger' });
      else if (due.state === 'soon') alerts.push({ id: m.id, title: m.name, msg: dueLabel(due), tone: 'warn' });
      if (m.warrantyEndDate) {
        const d = daysBetween(now, m.warrantyEndDate);
        if (d >= 0 && d <= 60) alerts.push({ id: `${m.id}-w`, title: m.name, msg: `보증 만료 D-${d}`, tone: 'warn' });
      }
    }
    return {
      total: materials.length,
      due: alerts.filter((a) => !a.id.endsWith('-w')).length,
      progress: repairs.filter((r) => r.stage !== 'DONE').length,
      alerts: alerts.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'danger' ? -1 : 1)).slice(0, 4),
    };
  }, []);
  const house = useLiveQuery(() => db.houses.toCollection().first(), []);

  if (!data) return <Loading />;
  const cards = [
    { label: '전체 자재', value: data.total, to: '/materials', icon: 'box' as const, cls: 'text-primary bg-primary-100' },
    { label: '교체 임박', value: data.due, to: '/materials?status=due', icon: 'calendar' as const, cls: 'text-warn bg-warn-bg' },
    { label: '진행 중 수리', value: data.progress, to: '/repairs', icon: 'wrench' as const, cls: 'text-primary bg-primary-100' },
  ];
  const tone = { danger: 'badge-danger', warn: 'badge-warn', info: 'badge-ok' } as const;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-extrabold text-navy">
          <img src="./favicon.svg" alt="" className="h-9 w-9 rounded-xl shadow-card-press" />
          HOMELOG
        </div>
        <Link to="/house" className="card-3d-press flex h-10 items-center gap-1 px-3 text-sm font-semibold" aria-label="우리 집 설정">우리 집 설정</Link>
      </div>

      <section className="relative overflow-hidden rounded-xl2 bg-grad-hero p-5 text-white shadow-float">
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <p className="text-sm text-white/70">{house?.name ?? '우리 집'}{house?.housingType ? ` · ${house.housingType}` : ''}</p>
        <h2 className="mt-1 text-[22px] font-extrabold leading-snug">우리 집,<br />지금도 안전한가요?</h2>
        <p className="mt-2 text-xs text-white/70">
          {data.total === 0 ? '자재를 기록해 두면 필요할 때 바로 찾을 수 있어요' : data.due > 0 ? `교체 시기가 다가온 자재 ${data.due}개` : '지금은 챙길 일이 없어요'}
        </p>
        <Link to="/materials" className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold text-navy shadow-card-press">
          자세히 보기 <Icon name="chevron" size={16} />
        </Link>
      </section>

      <Link to="/guide" className="card-3d-press flex items-center gap-3 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-2xl" aria-hidden>📖</span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">이용 가이드</span>
          <span className="block text-xs text-ink-sub">처음이라면 여기서 시작하세요. 메뉴별 역할과 사용 순서를 알려 드려요.</span>
        </span>
        <Icon name="chevron" size={18} className="shrink-0 text-ink-sub" />
      </Link>

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

      {data.alerts.length > 0 && (
        <section>
          <h3 className="mb-3 text-base font-bold">다가오는 알림</h3>
          <ul className="flex flex-col gap-2">
            {data.alerts.map((a) => (
              <li key={a.id}>
                <Link to={`/materials/${a.id.replace('-w', '')}`} className="card-3d-press flex items-center justify-between gap-3 p-4">
                  <span className="truncate font-semibold">{a.title}</span>
                  <span className={`badge shrink-0 ${tone[a.tone]}`}>{a.msg}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  );
}
