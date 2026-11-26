import { useRef, useState } from 'react';
import type { StoredPhoto } from '@/db/types';
import { compressImage } from '@/lib/image';
import { PhotoImg } from './Photo';
import { Icon } from './Icon';
import { useToast } from './Toast';

export const MAX_PHOTOS = 6;

export function PhotoPicker({ photos, onChange }: { photos: StoredPhoto[]; onChange: (p: StoredPhoto[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) { toast.show(`사진은 최대 ${MAX_PHOTOS}장까지 등록할 수 있어요`, 'info'); return; }
    setBusy(true);
    try {
      const added: StoredPhoto[] = [];
      for (const f of Array.from(files).slice(0, room)) added.push(await compressImage(f));
      onChange([...photos, ...added]);
    } catch {
      toast.show('사진을 처리하지 못했어요. 다시 시도해 주세요', 'error');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      <button type="button" onClick={() => ref.current?.click()} disabled={busy}
        className="card-3d-press flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 text-primary disabled:opacity-60">
        <Icon name="camera" size={26} />
        <span className="text-xs font-semibold">{busy ? '압축 중…' : `${photos.length}/${MAX_PHOTOS}`}</span>
      </button>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      {photos.map((p) => (
        <div key={p.id} className="relative h-24 w-24 shrink-0">
          <PhotoImg photo={p} className="h-24 w-24 rounded-2xl shadow-card-press" />
          <button type="button" aria-label="사진 삭제" onClick={() => onChange(photos.filter((x) => x.id !== p.id))}
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-navy text-xs text-white shadow-card-press">✕</button>
        </div>
      ))}
    </div>
  );
}
