import type React from 'react';

const rawAssetBase =
  (import.meta as any).env?.VITE_API_BASE_URL ??
  ((import.meta as any).env?.DEV ? 'http://localhost:8787' : '');
const ASSET_BASE = String(rawAssetBase || '').replace(/\/+$/, '');

function withAssetBase(url: string) {
  if (!url || /^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
  if ((import.meta as any).env?.DEV && ASSET_BASE && url.startsWith('/uploads/')) return `${ASSET_BASE}${url}`;
  return url;
}

export function getPreviewImageUrl(url: string) {
  if (!url || !url.includes('/images/original/')) return withAssetBase(url);
  const [pathPart, query = ''] = url.split('?');
  const dotIndex = pathPart.lastIndexOf('.');
  const withoutExt = dotIndex > -1 ? pathPart.slice(0, dotIndex) : pathPart;
  const preview = `${withoutExt.replace('/images/original/', '/images/derived/')}-preview.webp`;
  return withAssetBase(query ? `${preview}?${query}` : preview);
}

export function handlePreviewFallback(event: React.SyntheticEvent<HTMLImageElement>, originalUrl: string) {
  const image = event.currentTarget;
  if (image.src.endsWith(originalUrl) || image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  image.src = withAssetBase(originalUrl);
}
