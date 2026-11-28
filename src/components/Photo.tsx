import { useEffect, useState } from 'react';
import type { StoredPhoto } from '@/db/types';

export function useObjectUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) { setUrl(undefined); return; }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

export function PhotoImg({ photo, full = false, className = '' }: { photo?: StoredPhoto; full?: boolean; className?: string }) {
  const url = useObjectUrl(full ? photo?.blob : photo?.thumb);
  if (!url) return <div className={`bg-primary-50 ${className}`} />;
  return <img src={url} alt="" loading="lazy" className={`object-cover ${className}`} />;
}
