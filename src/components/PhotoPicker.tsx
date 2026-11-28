import { useRef, useState } from 'react';
import type { StoredPhoto } from '@/db/types';
import { compressImage, type PhotoProfile } from '@/lib/image';
import { PhotoImg } from './Photo';
import { useToast } from './Toast';

export const MAX_PHOTOS = 10;
const kb = (n: number) => Math.max(1, Math.round(n / 1024));

/** 파일 여러 장을 압축해서 StoredPhoto 배열로 만든다(자재 상세에서도 재사용) */
export async function compressFiles(files: File[], profile: PhotoProfile): Promise<StoredPhoto[]> {
  const out: StoredPhoto[] = [];
  for (const f of files) out.push(await compressImage(f, profile));
  return out;
}

export function PhotoPicker({ photos, onChange, profile = 'label' }: { photos: StoredPhoto[]; onChange: (p: StoredPhoto[]) => void; profile?: PhotoProfile }) {
  const camRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) { toast.show(`사진은 최대 ${MAX_PHOTOS}장까지 등록할 수 있어요`, 'info'); return; }
    setBusy(true);
    try {
      const added = await compressFiles(Array.from(files).slice(0, room), profile);
      onChange([...photos, ...added]);
      const total = added.reduce((a, p) => a + p.blob.size, 0);
      toast.show(`사진 ${added.length}장을 약 ${kb(total)}KB로 줄여 저장했어요`);
    } catch {
      toast.show('사진을 처리하지 못했어요. 다시 시도해 주세요', 'error');
    } finally {
      setBusy(false);
      if (camRef.current) camRef.current.value = '';
      if (albumRef.current) albumRef.current.value = '';
    }
  }

  return (
    <div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {photos.map((p) => (
          <div key={p.id} className="relative h-24 w-24 shrink-0">
            <PhotoImg photo={p} className="h-24 w-24 rounded-2xl shadow-card-press" />
            <button type="button" aria-label="사진 지우기" onClick={() => onChange(photos.filter((x) => x.id !== p.id))}
              className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-navy text-xs text-white shadow-card-press">✕</button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <button type="button" disabled={busy} className="btn-soft flex-1 !py-2.5 text-sm disabled:opacity-60" onClick={() => camRef.current?.click()}>{busy ? '줄이는 중…' : '📷 촬영'}</button>
        <button type="button" disabled={busy} className="btn-soft flex-1 !py-2.5 text-sm disabled:opacity-60" onClick={() => albumRef.current?.click()}>🖼️ 앨범에서</button>
        <span className="flex items-center text-xs text-ink-sub">{photos.length}/{MAX_PHOTOS}</span>
      </div>
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFiles(e.target.files)} />
      <input ref={albumRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
    </div>
  );
}
