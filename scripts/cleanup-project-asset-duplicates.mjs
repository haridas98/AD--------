import fs from 'node:fs';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';

const APPLY = process.argv.includes('--apply');
const ONLY = (process.argv.find((arg) => arg.startsWith('--only=')) || '').slice('--only='.length);
const UPLOADS_ROOT = process.env.UPLOADS_ROOT || path.resolve('public/uploads');
const REPORT_DIR = process.env.DUPE_REPORT_DIR || 'E:/AD/_audit';

const prisma = new PrismaClient();

function assetPath(asset) {
  return path.resolve(UPLOADS_ROOT, asset.storagePath);
}

function normalizeSourceKey(asset) {
  const parsed = path.parse(asset.originalFilename || asset.storagePath || asset.publicUrl || asset.id);
  const cleaned = parsed.name
    .toLowerCase()
    .replace(/^\d+-/, '')
    .replace(/^(?:2000|1600|1200|1000|800)-/, '')
    .replace(/-preview$/, '');
  const hashMatch = cleaned.match(/([a-f0-9]{24,})/i);
  if (hashMatch) return cleaned.replace(/-\d+$/, '');
  return '';
}

function sizeRank(asset) {
  const name = String(asset.originalFilename || '').toLowerCase();
  if (name.includes('2000-')) return 2000;
  if (name.includes('1600-')) return 1600;
  if (name.includes('1200-')) return 1200;
  if (name.includes('1000-')) return 1000;
  if (name.includes('800-')) return 800;
  return 0;
}

async function enrich(asset) {
  let width = asset.width || 0;
  let height = asset.height || 0;

  if ((!width || !height) && fs.existsSync(assetPath(asset))) {
    try {
      const metadata = await sharp(assetPath(asset)).metadata();
      width = metadata.width || 0;
      height = metadata.height || 0;
    } catch {
      // keep DB values
    }
  }

  return {
    ...asset,
    actualWidth: width,
    actualHeight: height,
    qualityScore: (width * height) + (Number(asset.fileSize || 0) / 100) + sizeRank(asset),
  };
}

function replaceAssetReferences(value, replacements) {
  if (Array.isArray(value)) {
    const next = value
      .map((item) => replaceAssetReferences(item, replacements))
      .filter(Boolean);

    const seen = new Set();
    return next.filter((item) => {
      if (!item || typeof item !== 'object' || !('url' in item)) return true;
      const key = item.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  if (!value || typeof value !== 'object') return value;

  const next = { ...value };
  if (typeof next.url === 'string' && replacements.has(next.url)) next.url = replacements.get(next.url);
  if (typeof next.image === 'string' && replacements.has(next.image)) next.image = replacements.get(next.image);
  if (typeof next.assetId === 'string' && replacements.has(next.assetId)) next.assetId = replacements.get(next.assetId);

  for (const [key, child] of Object.entries(next)) {
    if (key === 'url' || key === 'image' || key === 'assetId') continue;
    next[key] = replaceAssetReferences(child, replacements);
  }

  return next;
}

function parseContent(content) {
  try {
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
}

const projects = await prisma.project.findMany({
  where: {
    deletedAt: null,
    ...(ONLY ? { slug: ONLY } : {}),
  },
  include: {
    assets: {
      where: {
        kind: 'image',
        status: { not: 'archived' },
      },
    },
  },
});

const report = [];

for (const project of projects) {
  const assets = await Promise.all(project.assets.map(enrich));
  const groups = new Map();

  for (const asset of assets) {
    const key = normalizeSourceKey(asset) || (asset.checksum ? `checksum:${asset.checksum}` : '');
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(asset);
  }

  const duplicateGroups = Array.from(groups.entries())
    .map(([key, group]) => [key, group.sort((a, b) => b.qualityScore - a.qualityScore)])
    .filter(([, group]) => group.length > 1);

  if (!duplicateGroups.length) continue;

  const replacements = new Map();
  const archiveIds = [];
  const groupReport = [];

  for (const [key, group] of duplicateGroups) {
    const keep = group[0];
    const archive = group.slice(1);
    for (const asset of archive) {
      replacements.set(asset.publicUrl, keep.publicUrl);
      replacements.set(asset.id, keep.id);
      archiveIds.push(asset.id);
    }

    groupReport.push({
      key,
      keep: {
        id: keep.id,
        url: keep.publicUrl,
        filename: keep.originalFilename,
        width: keep.actualWidth,
        height: keep.actualHeight,
        fileSize: keep.fileSize,
      },
      archive: archive.map((asset) => ({
        id: asset.id,
        url: asset.publicUrl,
        filename: asset.originalFilename,
        width: asset.actualWidth,
        height: asset.actualHeight,
        fileSize: asset.fileSize,
      })),
    });
  }

  if (APPLY) {
    const content = parseContent(project.content);
    const nextContent = replaceAssetReferences(content, replacements);
    const now = new Date().toISOString();

    await prisma.project.update({
      where: { id: project.id },
      data: {
        content: JSON.stringify(nextContent),
        updatedAt: now,
      },
    });

    await prisma.projectAssetUsage.deleteMany({
      where: { assetId: { in: archiveIds } },
    });

    await prisma.projectAsset.updateMany({
      where: { id: { in: archiveIds } },
      data: {
        status: 'archived',
        includeInAi: false,
        updatedAt: now,
      },
    });
  }

  report.push({
    project: project.title,
    slug: project.slug,
    groups: groupReport.length,
    archived: archiveIds.length,
    duplicateGroups: groupReport,
  });
}

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(REPORT_DIR, 'project-asset-duplicate-cleanup.json'),
  JSON.stringify({ mode: APPLY ? 'APPLY' : 'DRY_RUN', projects: report }, null, 2),
  'utf8',
);

console.log(JSON.stringify({
  mode: APPLY ? 'APPLY' : 'DRY_RUN',
  projects: report.length,
  groups: report.reduce((sum, item) => sum + item.groups, 0),
  archived: report.reduce((sum, item) => sum + item.archived, 0),
}, null, 2));

await prisma.$disconnect();
