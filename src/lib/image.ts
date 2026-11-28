import type { StoredPhoto } from '@/db/types';
import { uid } from '@/db/repo';

export const MAX_EDGE = 1200;
export const THUMB_EDGE = 300;
export const TARGET_MAX_BYTES = 300 * 1024;

/** 긴 변이 maxEdge를 넘으면 비율을 유지해 축소한 크기를 반환 (확대는 하지 않음) */
export function fitSize(w: number, h: number, maxEdge: number): { width: number; height: number } {
  const long = Math.max(w, h);
  if (long <= maxEdge) return { width: w, height: h };
  const r = maxEdge / long;
  return { width: Math.round(w * r), height: Math.round(h * r) };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function render(bitmap: ImageBitmap, edge: number): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const { width, height } = fitSize(bitmap.width, bitmap.height, edge);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.drawImage(bitmap, 0, 0, width, height);
  return { canvas, width, height };
}

export type PhotoProfile = 'label' | 'normal';
/** label: 제품 라벨·시리얼 번호가 읽히는 정도로 작게(약 150KB) / normal: 기존 품질(약 300KB) */
export const PROFILES: Record<PhotoProfile, { maxEdge: number; maxBytes: number }> = {
  label: { maxEdge: 1000, maxBytes: 150 * 1024 },
  normal: { maxEdge: MAX_EDGE, maxBytes: TARGET_MAX_BYTES },
};

/** WebP 우선(미지원 시 JPEG). 목표 용량 이하가 될 때까지 품질을 낮추고, 그래도 크면 크기를 줄인다 */
async function encode(bitmap: ImageBitmap, edge: number, maxBytes: number): Promise<{ blob: Blob; width: number; height: number }> {
  let last: { blob: Blob; width: number; height: number } | null = null;
  for (const scale of [1, 0.8, 0.65]) {
    const { canvas, width, height } = await render(bitmap, Math.round(edge * scale));
    for (const q of [0.72, 0.58, 0.45]) {
      const blob = (await canvasToBlob(canvas, 'image/webp', q)) ?? (await canvasToBlob(canvas, 'image/jpeg', q));
      if (!blob) throw new Error('이미지 인코딩 실패');
      last = { blob, width, height };
      if (blob.size <= maxBytes) return last;
    }
  }
  return last as { blob: Blob; width: number; height: number };
}

/** 사진 파일 → 프로필에 맞춰 압축 + 목록용 썸네일. EXIF 회전은 createImageBitmap이 반영. */
export async function compressImage(file: Blob, profile: PhotoProfile = 'normal'): Promise<StoredPhoto> {
  const { maxEdge, maxBytes } = PROFILES[profile];
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const main = await encode(bitmap, maxEdge, maxBytes);
    const thumb = await encode(bitmap, THUMB_EDGE, 40 * 1024);
    return { id: uid(), blob: main.blob, thumb: thumb.blob, width: main.width, height: main.height, createdAt: Date.now() };
  } finally {
    bitmap.close();
  }
}
