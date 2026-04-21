import type { CSSProperties } from 'react';

export type CoverCrop = {
  scale?: number;
  x?: number;
  y?: number;
};

export type ImageAsset = {
  url: string;
  alt?: string;
  crop?: CoverCrop;
};

export function normalizeImageAsset(item: any): ImageAsset | null {
  if (!item) return null;
  if (typeof item === 'string') return { url: item, alt: '', crop: { scale: 1, x: 0, y: 0 } };

  if (!item.url) return null;

  return {
    url: item.url,
    alt: item.alt || '',
    crop: {
      scale: Number(item.crop?.scale ?? 1),
      x: Number(item.crop?.x ?? 0),
      y: Number(item.crop?.y ?? 0),
    },
  };
}

export function getCoverImageStyle(crop?: CoverCrop): CSSProperties {
  const scale = Number(crop?.scale ?? 1);
  const x = Number(crop?.x ?? 0);
  const y = Number(crop?.y ?? 0);

  return {
    transform: `translate(${x}%, ${y}%) scale(${scale})`,
    transformOrigin: 'center center',
  };
}
