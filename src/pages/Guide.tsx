import { Link } from 'react-router-dom';
import { BackHeader } from '@/components/BackHeader';
import { FAQ, FIRST_STEPS, MENU_ROLES } from '@/data/guide';

export function Guide() {
  return (
    <>
      <BackHeader title="이용 가이드" to="/" />
      <div className="flex flex-col gap-5">
        <section>
          <h2 className="mb-2 px-1 text-base font-bold">처음이라면 이 순서로</h2>
          <ol className="flex flex-col gap-3">
            {FIRST_STEPS.map((s) => (
              <li key={s.n} className="card-3d flex gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-grad-primary font-extrabold text-white">{s.n}</span>
                <div><div className="font-bold">{s.title}</div><p className="mt-0.5 break-keep text-[13px] leading-relaxed text-ink-sub">{s.desc}</p></div>
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h2 className="mb-2 px-1 text-base font-bold">메뉴별 역할</h2>
          <ul className="flex flex-col gap-3">
            {MENU_ROLES.map((m) => {
              const body = (
                <>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-2xl" aria-hidden>{m.emoji}</span>
                  <div className="min-w-0"><div className="font-bold">{m.title}</div>
                    <p className="break-keep text-[13px] leading-relaxed text-ink-sub">{m.role}</p>
                    <p className="mt-1 text-xs text-primary">예) {m.example}</p></div>
                </>);
              return <li key={m.title}>{m.to ? <Link to={m.to} className="card-3d-press flex gap-3 p-3.5">{body}</Link> : <div className="card-3d flex gap-3 p-3.5">{body}</div>}</li>;
            })}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 px-1 text-base font-bold">자주 묻는 질문</h2>
          <div className="flex flex-col gap-2">
            {FAQ.map((f) => (
              <details key={f.q} className="card-3d p-4">
                <summary className="cursor-pointer text-[15px] font-semibold">{f.q}</summary>
                <p className="mt-2 break-keep text-[13px] leading-relaxed text-ink-sub">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
