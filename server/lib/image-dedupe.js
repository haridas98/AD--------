import fs from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

export const DEFAULT_VISUAL_DUPLICATE_THRESHOLD = 8;

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

export function isImagePath(filePath) {
  return IMAGE_EXTENSIONS.has(path.extname(String(filePath || '')).toLowerCase());
}

export async function computeVisualHashFromBuffer(buffer) {
  const { data } = await sharp(buffer, { animated: false })
    .rotate()
    .resize(16, 16, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const values = Array.from(data);
  const average = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
  return values.map((value) => (value >= average ? '1' : '0')).join('');
}

export async function computeVisualHashFromFile(filePath) {
  if (!isImagePath(filePath) || !fs.existsSync(filePath)) return '';
  const buffer = await fs.promises.readFile(filePath);
  return computeVisualHashFromBuffer(buffer);
}

export function hammingDistance(left, right) {
  let distance = 0;
  const length = Math.min(String(left).length, String(right).length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) distance += 1;
  }
  return distance + Math.abs(String(left).length - String(right).length);
}

export function findSimilarVisualHash(visualHash, candidates, threshold = DEFAULT_VISUAL_DUPLICATE_THRESHOLD) {
  if (!visualHash) return null;

  for (const candidate of candidates) {
    if (!candidate.visualHash) continue;
    const distance = hammingDistance(visualHash, candidate.visualHash);
    if (distance <= threshold) return { ...candidate, distance };
  }

  return null;
}

export function resolveAssetLocalPath(asset, uploadsRoot) {
  const root = path.resolve(uploadsRoot);
  const candidates = [
    asset.sourcePath && !/^https?:\/\//i.test(asset.sourcePath) ? path.resolve(asset.sourcePath) : '',
    asset.storagePath ? path.resolve(root, asset.storagePath) : '',
    asset.publicUrl?.startsWith('/uploads/') ? path.resolve(root, asset.publicUrl.slice('/uploads/'.length)) : '',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    if (candidate.startsWith(root) || candidate === path.resolve(asset.sourcePath || '')) return candidate;
  }

  return '';
}

export async function buildAssetVisualCandidates(assets, uploadsRoot) {
  const candidates = [];

  for (const asset of assets || []) {
    if (asset.kind !== 'image') continue;
    const filePath = resolveAssetLocalPath(asset, uploadsRoot);
    if (!filePath) continue;

    try {
      const visualHash = await computeVisualHashFromFile(filePath);
      if (visualHash) candidates.push({ asset, visualHash });
    } catch {
      // Ignore unreadable images. Exact checksum still protects duplicates where available.
    }
  }

  return candidates;
}
