import fs from 'node:fs';
import path from 'node:path';

import { computeFileChecksum, detectAssetKindFromPath, prepareProjectAssetPayload } from './project-assets.js';
import {
  buildAssetVisualCandidates,
  computeVisualHashFromBuffer,
  DEFAULT_VISUAL_DUPLICATE_THRESHOLD,
  findSimilarVisualHash,
} from './image-dedupe.js';

const ARCHIVE_ROOT = path.resolve('scripts/site-image-archive/alexandradiz.com/_');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function parseProjectContent(content) {
  if (!content) return [];
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch {
      return [];
    }
  }
  return Array.isArray(content) ? content : [];
}

function collectProjectBlockMediaUrls(blocks) {
  return blocks
    .flatMap((block) => {
      if (block.type === 'heroImage' && block.data?.image) return [block.data.image];
      if (block.type === 'imageGrid') return (block.data?.images || []).map((item) => (typeof item === 'string' ? item : item?.url));
      if (block.type === 'beforeAfter') return [block.data?.beforeImage, block.data?.afterImage];
      if (block.type === 'refinedSlider') return (block.data?.images || []).map((item) => (typeof item === 'string' ? item : item?.url));
      if (block.type === 'mosaicPreset') return (block.data?.images || []).map((item) => (typeof item === 'string' ? item : item?.url));
      if (block.type === 'circleDetail') return (block.data?.items || []).map((item) => item?.image);
      if (block.type === 'editorialNote') return [block.data?.image];
      if (block.type === 'sideBySide') return [block.data?.image];
      return [];
    })
    .filter(Boolean);
}

function toLegacyStoragePath(url) {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return url.slice('/uploads/'.length);

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/uploads/')) return parsed.pathname.slice('/uploads/'.length);
    const pathname = parsed.pathname.replace(/^\/+/, '');
    return path.posix.join('external', parsed.hostname, pathname || 'asset');
  } catch {
    return path.posix.join('external', `asset-${Buffer.from(url).toString('base64url').slice(0, 24)}`);
  }
}

function getPublicUrlFromStoragePath(storagePath) {
  return storagePath.startsWith('external/') ? `/${storagePath}` : `/uploads/${storagePath}`;
}

function resolveLocalUploadPath(url, uploadsRoot) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/uploads/')) {
      return path.resolve(uploadsRoot, parsed.pathname.slice('/uploads/'.length));
    }
    return null;
  } catch {
    if (url.startsWith('/uploads/')) {
      return path.resolve(uploadsRoot, url.slice('/uploads/'.length));
    }
    return null;
  }
}

function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function guessMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function normalizeArchiveKey(value) {
  return toSlug(value).replace(/-/g, '');
}

function resolveArchiveProjectFolders(project) {
  if (!fs.existsSync(ARCHIVE_ROOT)) return null;

  const entries = fs.readdirSync(ARCHIVE_ROOT, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  const findStrictMatch = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;

    const rawMatch = entries.find((entry) => entry.name.toLowerCase() === raw.toLowerCase());
    if (rawMatch) return path.join(ARCHIVE_ROOT, rawMatch.name);

    const normalized = normalizeArchiveKey(raw);
    const match = entries.find((entry) => normalizeArchiveKey(entry.name) === normalized);

    return match ? path.join(ARCHIVE_ROOT, match.name) : null;
  };

  const slugMatch = findStrictMatch(project.slug);
  if (slugMatch) return [slugMatch];

  const titleMatch = findStrictMatch(project.title);
  return titleMatch ? [titleMatch] : null;
}

function collectArchiveImages(archiveFolder) {
  const imagesFolder = path.join(archiveFolder, 'images');
  if (!fs.existsSync(imagesFolder)) return [];

  return fs.readdirSync(imagesFolder)
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .map((name) => path.join(imagesFolder, name));
}

export async function importProjectAssetsFromArchive({
  prisma,
  project,
  uploadsRoot,
  saveProjectAssetUpload,
  visualDuplicateThreshold = DEFAULT_VISUAL_DUPLICATE_THRESHOLD,
}) {
  const archiveFolders = resolveArchiveProjectFolders(project);
  if (!archiveFolders?.length) return { created: 0, skipped: 0, skippedSimilar: 0 };

  const files = [...new Set(archiveFolders.flatMap((archiveFolder) => collectArchiveImages(archiveFolder)))];
  const existingAssets = await prisma.projectAsset.findMany({
    where: {
      projectId: project.id,
      status: { not: 'archived' },
    },
  });
  const visualCandidates = await buildAssetVisualCandidates(existingAssets, uploadsRoot);

  let created = 0;
  let skipped = 0;
  let skippedSimilar = 0;

  for (const filePath of files) {
    const existingBySourcePath = await prisma.projectAsset.findFirst({
      where: {
        projectId: project.id,
        sourcePath: filePath,
      },
    });

    if (existingBySourcePath) {
      skipped += 1;
      continue;
    }

    const buffer = await fs.promises.readFile(filePath);
    const prepared = await prepareProjectAssetPayload({
      originalFilename: path.basename(filePath),
      mimeType: guessMimeType(filePath),
      buffer,
    });
    const checksum = prepared.checksum;
    const existingByChecksum = await prisma.projectAsset.findFirst({
      where: {
        projectId: project.id,
        checksum,
      },
    });

    if (existingByChecksum) {
      skipped += 1;
      continue;
    }

    const visualHash = await computeVisualHashFromBuffer(prepared.outputBuffer);
    const similar = findSimilarVisualHash(visualHash, visualCandidates, visualDuplicateThreshold);
    if (similar) {
      skippedSimilar += 1;
      continue;
    }

    const saved = await saveProjectAssetUpload({
      uploadsRoot,
      projectSlug: project.slug,
      originalFilename: path.basename(filePath),
      mimeType: guessMimeType(filePath),
      buffer,
    });

    await prisma.projectAsset.create({
      data: {
        projectId: project.id,
        kind: detectAssetKindFromPath(filePath),
        storagePath: saved.storagePath,
        publicUrl: saved.publicUrl,
        originalFilename: saved.originalFilename,
        mimeType: saved.mimeType,
        width: saved.width,
        height: saved.height,
        fileSize: saved.fileSize,
        checksum: saved.checksum,
        status: 'active',
        sourceType: 'legacy-import',
        sourcePath: filePath,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    visualCandidates.push({
      visualHash,
      asset: {
        id: 'new',
        publicUrl: saved.publicUrl,
        sourcePath: saved.absolutePath,
        storagePath: saved.storagePath,
        kind: saved.kind,
      },
    });
    created += 1;
  }

  return { created, skipped, skippedSimilar };
}

export async function hydrateProjectAssetsFromContent({ prisma, project, uploadsRoot }) {
  const existingAssets = await prisma.projectAsset.findMany({
    where: { projectId: project.id },
  });

  if (existingAssets.length) {
    return { created: 0, skipped: existingAssets.length, hydrated: false };
  }

  const blocks = parseProjectContent(project.content);
  const urls = [...new Set(collectProjectBlockMediaUrls(blocks))];
  let created = 0;
  let skipped = 0;

  for (const url of urls) {
    const storagePath = toLegacyStoragePath(url);
    if (!storagePath) {
      skipped += 1;
      continue;
    }

    const existing = await prisma.projectAsset.findFirst({
      where: {
        projectId: project.id,
        storagePath,
      },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    const localPath = resolveLocalUploadPath(url, uploadsRoot);
    const hasLocalFile = localPath ? fs.existsSync(localPath) : false;
    const kind = detectAssetKindFromPath(localPath || url);
    const fileSize = hasLocalFile ? Math.round(fs.statSync(localPath).size) : null;
    const checksum = hasLocalFile ? await computeFileChecksum(localPath) : null;
    const sourceType = hasLocalFile ? 'legacy-import' : 'remote-import';

    await prisma.projectAsset.create({
      data: {
        projectId: project.id,
        kind,
        storagePath,
        publicUrl: url.startsWith('/uploads/') || url.startsWith('http') ? url : getPublicUrlFromStoragePath(storagePath),
        originalFilename: path.basename(storagePath),
        fileSize,
        checksum,
        status: hasLocalFile || url.startsWith('http') ? 'active' : 'missing',
        sourceType,
        sourcePath: hasLocalFile ? localPath : url,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    created += 1;
  }

  return { created, skipped, hydrated: created > 0 };
}
