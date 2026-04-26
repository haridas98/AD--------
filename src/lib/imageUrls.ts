import type React from 'react';

export function getPreviewImageUrl(url: string) {
  if (!url || !url.includes('/images/original/')) return url;
  const [pathPart, query = ''] = url.split('?');
  const dotIndex = pathPart.lastIndexOf('.');
  const withoutExt = dotIndex > -1 ? pathPart.slice(0, dotIndex) : pathPart;
  const preview = `${withoutExt.replace('/images/original/', '/images/derived/')}-preview.webp`;
  return query ? `${preview}?${query}` : preview;
}

export function handlePreviewFallback(event: React.SyntheticEvent<HTMLImageElement>, originalUrl: string) {
  const image = event.currentTarget;
  if (image.src.endsWith(originalUrl) || image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  image.src = originalUrl;
}
