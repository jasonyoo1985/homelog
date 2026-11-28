import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Capacitor } from '@capacitor/core';
import { db } from '@/db/db';
import { ensureHouse } from '@/db/repo';
import { backupFilename, buildBackup, importPack, isBackup, parsePack, restoreBackup, type BackupFile, type PackItem } from '@/lib/backup';
import { parseCatalog, replaceCatalog } from '@/lib/catalog';
import type { CatalogEntry } from '@/db/types';
import { BackHeader } from '@/components/BackHeader';
import { useToast } from '@/components/Toast';

type Pending =
  | { kind: 'backup'; file: BackupFile; summary: string }
  | { kind: 'pack'; items: PackItem[]; summary: string }
  | { kind: 'catalog'; entries: CatalogEntry[]; title: string; note: string; summary: string };

const LAST_KEY = 'homelog.lastBackup';
const getLast = (): string => { try { return localStorage.getItem(LAST_KEY) ?? ''; } catch { return ''; } };

async function saveAndShare(filename: string, text: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const r = await Filesystem.writeFile({ path: filename, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: filename, url: r.uri, dialogTitle: '백업 파일 저장하기' });
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function Backup() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(getLast());
  const catalogCount = useLiveQuery(() => db.catalog.count(), []);
  const counts = useLiveQuery(async () => ({ m: await db.materials.count(), r: await db.repairs.count() }), []);

  async function doExport() {
    setBusy(true);
    try {
      const file = await buildBackup();
      await saveAndShare(backupFilename(), JSON.stringify(file));
      const now = new Date().toISOString().slice(0, 10);
      try { localStorage.setItem(LAST_KEY, now); } catch { /* 무시 */ }
      setLast(now);
      toast.show('백업 파일을 만들었어요');
    } catch { toast.show('백업 파일을 만들지 못했어요', 'error'); }
    finally { setBusy(false); }
  }

  async function onFile(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    try {
      const json: unknown = JSON.parse(await f.text());
      if (isBackup(json)) {
        const d = json.data;
        setPending({ kind: 'backup', file: json, summary: `자재 ${d.materials?.length ?? 0}개 · 수리 ${d.repairs?.length ?? 0}건 · 문서 ${d.documents?.length ?? 0}건 (저장일 ${new Date(json.exportedAt).toLocaleDateString('ko-KR')})` });
        return;
      }
      const pack = parsePack(json);
      if (pack) { setPending({ kind: 'pack', items: pack, summary: `자재 ${pack.length}개를 추가해요. 같은 공간·이름이 이미 있으면 건너뛰어요.` }); return; }
      const cat = parseCatalog(json);
      if (cat) {
        const kinds = new Set(cat.entries.map((e) => e.item)).size;
        setPending({ kind: 'catalog', entries: cat.entries, title: cat.title, note: cat.note, summary: `${cat.title} · 품목 ${kinds}개 · 제품 ${cat.entries.length}개` });
        return;
      }
      toast.show('홈로그에서 만든 파일이 아니에요', 'error');
    } catch { toast.show('파일을 읽지 못했어요', 'error'); }
    finally { if (fileRef.current) fileRef.current.value = ''; }
  }

  async function apply(mode?: 'merge' | 'replace') {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.kind === 'backup') {
        if (mode === 'replace' && !window.confirm('지금 폰에 있는 모든 기록을 지우고 백업 파일로 바꿀까요? 되돌릴 수 없어요.')) { setBusy(false); return; }
        await restoreBackup(pending.file, mode ?? 'merge');
        toast.show('백업을 불러왔어요');
      } else if (pending.kind === 'pack') {
        const h = await ensureHouse();
        const n = await importPack(h.id, pending.items);
        toast.show(`자재 ${n}개를 추가했어요`);
      } else {
        await replaceCatalog(pending.entries);
        toast.show(`제품 ${pending.entries.length}개를 불러왔어요. 자재 등록에서 고를 수 있어요`);
      }
      setPending(null);
    } catch { toast.show('불러오지 못했어요', 'error'); }
    finally { setBusy(false); }
  }

  async function clearCatalog() {
    if (!window.confirm('불러온 마감재 리스트를 지울까요? 이미 등록한 자재는 그대로 남아요.')) return;
    await db.catalog.clear();
    toast.show('마감재 리스트를 지웠어요', 'info');
  }

  return (
    <>
      <BackHeader title="가져오기 · 내보내기" />
      <div className="flex flex-col gap-4">
        <section className="card-3d p-4">
          <h2 className="text-sm font-bold">기록 백업하기</h2>
          <p className="mt-1 break-keep text-xs leading-relaxed text-ink-sub">
            홈로그는 기록을 이 폰에만 저장해요. 폰을 바꾸거나 앱을 지우면 사라지니, 가끔 파일로 저장해 두세요. (자재 {counts?.m ?? 0}개 · 수리 {counts?.r ?? 0}건{last ? ` · 마지막 백업 ${last}` : ''})
          </p>
          <button className="btn-3d mt-3 w-full disabled:opacity-60" disabled={busy} onClick={doExport}>{busy ? '만드는 중…' : '백업 파일 만들기'}</button>
        </section>

        <section className="card-3d p-4">
          <h2 className="text-sm font-bold">파일 불러오기</h2>
          <p className="mt-1 break-keep text-xs leading-relaxed text-ink-sub">백업 파일, 자재 묶음 파일, 마감재 리스트(카탈로그) 파일을 자동으로 알아봐요.</p>
          <button className="btn-soft mt-3 w-full" onClick={() => fileRef.current?.click()}>파일 선택하기</button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => onFile(e.target.files)} />
          {pending && (
            <div className="mt-3 rounded-2xl bg-primary-50 p-3 text-sm anim-fade">
              <div className="font-bold text-primary">{pending.kind === 'backup' ? '백업 파일' : pending.kind === 'pack' ? '자재 묶음' : '마감재 리스트'}</div>
              <p className="mt-1 break-keep">{pending.summary}</p>
              {pending.kind === 'catalog' && pending.note && <p className="mt-1 break-keep text-xs text-ink-sub">{pending.note}</p>}
              <div className="mt-3 flex gap-2">
                <button className="btn-soft flex-1 !py-2.5 text-sm" onClick={() => setPending(null)}>취소</button>
                {pending.kind === 'backup' ? (
                  <>
                    <button className="btn-soft flex-1 !py-2.5 text-sm" disabled={busy} onClick={() => apply('merge')}>합치기</button>
                    <button className="btn-3d flex-1 !py-2.5 text-sm" disabled={busy} onClick={() => apply('replace')}>모두 바꾸기</button>
                  </>
                ) : (
                  <button className="btn-3d flex-1 !py-2.5 text-sm" disabled={busy} onClick={() => apply()}>{pending.kind === 'pack' ? '추가하기' : '불러오기'}</button>
                )}
              </div>
            </div>)}
        </section>

        <section className="card-3d p-4">
          <h2 className="text-sm font-bold">마감재 리스트(카탈로그)</h2>
          <p className="mt-1 break-keep text-xs leading-relaxed text-ink-sub">
            {catalogCount ? `불러온 제품 ${catalogCount}개. 자재 등록 화면에서 품목을 고르고 제품을 골라 한 번에 채울 수 있어요.` : '아직 불러온 리스트가 없어요. 위에서 카탈로그 파일을 불러오세요.'}
          </p>
          {!!catalogCount && <button className="mt-3 text-sm font-semibold text-danger" onClick={clearCatalog}>불러온 리스트 지우기</button>}
        </section>
      </div>
    </>
  );
}
