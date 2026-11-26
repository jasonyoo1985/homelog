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
      need: materials.filter((m) => m.status !== 'VERIFIED').length,
      due: alerts.filter((a) => !a.id.endsWith('-w')).length,
      progress: repairs.filter((r) => r.stage !== 'DONE').length,
      alerts: alerts.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'danger' ? -1 : 1)).slice(0, 4),
      todo: materials.filter((m) => m.status === 'UNKNOWN').slice(0, 3),
    };
  }, []);
  const house = useLiveQuery(() => db.houses.toCollection().first(), []);

  if (!data) return <Loading />;
  const cards = [
    { label: '전체 자재', value: data.total, to: '/materials', icon: 'box' as const, cls: 'text-primary bg-primary-100' },
    { label: '확인 필요', value: data.need, to: '/materials?status=need', icon: 'alert' as const, cls: 'text-danger bg-danger-bg' },
    { label: '교체 임박', value: data.due, to: '/materials?status=due', icon: 'calendar' as const, cls: 'text-warn bg-warn-bg' },
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
          {data.total === 0 ? '표준 자재를 만들어 시작해 보세요' : data.need === 0 ? '모든 자재 정보가 확인되었어요' : `확인이 필요한 자재 ${data.need}개`}
        </p>
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

      {data.todo.length > 0 && (
        <section>
          <h3 className="mb-3 text-base font-bold">이것부터 확인해 볼까요?</h3>
          <ul className="flex flex-col gap-2">
            {data.todo.map((m) => (
              <li key={m.id}>
                <Link to={`/materials/${m.id}`} className="card-3d-press flex items-center justify-between p-4">
                  <span><span className="font-semibold">{m.name}</span><span className="ml-2 text-xs text-ink-sub">{m.roomName}</span></span>
                  <Icon name="chevron" size={18} className="text-ink-sub" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
