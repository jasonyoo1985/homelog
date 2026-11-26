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

/** WebP 우선(미지원 시 JPEG)으로 품질을 낮춰가며 목표 용량(300KB) 이하를 맞춘다. */
async function encode(canvas: HTMLCanvasElement, maxBytes: number): Promise<Blob> {
  let quality = 0.82;
  let blob: Blob | null = null;
  for (let i = 0; i < 5; i++) {
    blob = (await canvasToBlob(canvas, 'image/webp', quality)) ?? (await canvasToBlob(canvas, 'image/jpeg', quality));
    if (!blob) throw new Error('이미지 인코딩 실패');
    if (blob.size <= maxBytes) break;
    quality -= 0.12;
  }
  return blob as Blob;
}

/** 사진 파일 → 1200px WebP(≤~300KB) + 300px 썸네일. EXIF 회전은 createImageBitmap이 반영. */
export async function compressImage(file: Blob): Promise<StoredPhoto> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const main = await render(bitmap, MAX_EDGE);
    const blob = await encode(main.canvas, TARGET_MAX_BYTES);
    const th = await render(bitmap, THUMB_EDGE);
    const thumb = await encode(th.canvas, 40 * 1024);
    return { id: uid(), blob, thumb, width: main.width, height: main.height, createdAt: Date.now() };
  } finally {
    bitmap.close();
  }
}
