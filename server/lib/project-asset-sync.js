import fs from 'node:fs';
import path from 'node:path';

import {
  computeFileChecksum,
  detectAssetKindFromPath,
} from './project-assets.js';
import {
  buildAssetVisualCandidates,
  computeVisualHashFromFile,
  DEFAULT_VISUAL_DUPLICATE_THRESHOLD,
  findSimilarVisualHash,
  isImagePath,
} from './image-dedupe.js';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.webm', '.m4v']);

function isSupportedAsset(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext);
}

function pickCanonicalAsset(assets) {
  return [...assets].sort((left, right) => {
    const leftUsage = left._count?.usages || 0;
    const rightUsage = right._count?.usages || 0;
    if (leftUsage !== rightUsage) return rightUsage - leftUsage;

    const leftActive = left.status === 'active' ? 1 : 0;
    const rightActive = right.status === 'active' ? 1 : 0;
    if (leftActive !== rightActive) return rightActive - leftActive;

    return String(left.createdAt || '').localeCompare(String(right.createdAt || ''));
  })[0];
}

async function collectFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];

  const entries = await fs.promises.readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
      continue;
    }

    if (entry.isFile() && isSupportedAsset(absolutePath)) {
      files.push(absolutePath);
    }
  }

  return files;
}

export async function syncProjectAssetFolder({
  prisma,
  project,
  uploadsRoot,
  visualDuplicateThreshold = DEFAULT_VISUAL_DUPLICATE_THRESHOLD,
}) {
  const projectRoot = path.resolve(uploadsRoot, 'projects', project.slug);
  const files = await collectFiles(projectRoot);
  const existingAssets = await prisma.projectAsset.findMany({
    where: { projectId: project.id },
    include: {
      _count: { select: { usages: true } },
    },
  });

  const byStoragePath = new Map();
  const byChecksum = new Map();
  const seenStoragePaths = new Set();
  const archivedDuplicateIds = new Set();
  const visualCandidates = await buildAssetVisualCandidates(
    existingAssets.filter((asset) => asset.status !== 'archived' && asset.status !== 'missing'),
    uploadsRoot,
  );

  const summary = {
    created: 0,
    updated: 0,
    markedMissing: 0,
    skippedDuplicates: 0,
    skippedSimilar: 0,
    archivedDuplicates: 0,
  };

  const storageGroups = new Map();
  const checksumGroups = new Map();

  for (const asset of existingAssets) {
    if (asset.storagePath) {
      if (!storageGroups.has(asset.storagePath)) storageGroups.set(asset.storagePath, []);
      storageGroups.get(asset.storagePath).push(asset);
    }

    if (asset.checksum) {
      if (!checksumGroups.has(asset.checksum)) checksumGroups.set(asset.checksum, []);
      checksumGroups.get(asset.checksum).push(asset);
    }
  }

  for (const [storagePath, group] of storageGroups.entries()) {
    const canonical = pickCanonicalAsset(group);
    byStoragePath.set(storagePath, canonical);

    for (const asset of group) {
      if (asset.id === canonical.id) continue;
      if ((asset._count?.usages || 0) > 0) continue;
      if (asset.status === 'archived') continue;
      if (archivedDuplicateIds.has(asset.id)) continue;

      await prisma.projectAsset.update({
        where: { id: asset.id },
        data: {
          status: 'archived',
          updatedAt: new Date().toISOString(),
        },
      });
      archivedDuplicateIds.add(asset.id);
      summary.archivedDuplicates += 1;
    }
  }

  for (const [checksum, group] of checksumGroups.entries()) {
    const canonical = pickCanonicalAsset(group);
    byChecksum.set(checksum, canonical);

    for (const asset of group) {
      if (asset.id === canonical.id) continue;
      if ((asset._count?.usages || 0) > 0) continue;
      if (asset.status === 'archived') continue;
      if (archivedDuplicateIds.has(asset.id)) continue;

      await prisma.projectAsset.update({
        where: { id: asset.id },
        data: {
          status: 'archived',
          updatedAt: new Date().toISOString(),
        },
      });
      archivedDuplicateIds.add(asset.id);
      summary.archivedDuplicates += 1;
    }
  }

  for (const filePath of files) {
    const relativeStoragePath = path.relative(uploadsRoot, filePath).split(path.sep).join(path.posix.sep);
    seenStoragePaths.add(relativeStoragePath);

    const checksum = await computeFileChecksum(filePath);
    const stat = await fs.promises.stat(filePath);
    const kind = detectAssetKindFromPath(filePath);
    const publicUrl = `/${path.posix.join('uploads', relativeStoragePath)}`;
    const existingByPath = byStoragePath.get(relativeStoragePath);

    if (existingByPath) {
      const nextData = {
        checksum,
        fileSize: Math.round(stat.size),
        status: 'active',
        publicUrl,
        originalFilename: path.basename(filePath),
        sourcePath: filePath,
        updatedAt: new Date().toISOString(),
      };

      await prisma.projectAsset.update({
        where: { id: existingByPath.id },
        data: nextData,
      });
      byStoragePath.set(relativeStoragePath, { ...existingByPath, ...nextData });
      if (checksum) byChecksum.set(checksum, { ...existingByPath, ...nextData });
      summary.updated += 1;
      continue;
    }

    const existingByChecksum = byChecksum.get(checksum);
    if (existingByChecksum) {
      const previousStoragePath = existingByChecksum.storagePath;
      const nextData = {
        kind,
        storagePath: relativeStoragePath,
        publicUrl,
        originalFilename: path.basename(filePath),
        fileSize: Math.round(stat.size),
        checksum,
        status: 'active',
        sourceType: 'folder-sync',
        sourcePath: filePath,
        updatedAt: new Date().toISOString(),
      };

      await prisma.projectAsset.update({
        where: { id: existingByChecksum.id },
        data: nextData,
      });
      if (previousStoragePath) byStoragePath.delete(previousStoragePath);
      byStoragePath.set(relativeStoragePath, { ...existingByChecksum, ...nextData });
      byChecksum.set(checksum, { ...existingByChecksum, ...nextData });
      summary.skippedDuplicates += 1;
      continue;
    }

    if (kind === 'image' && isImagePath(filePath)) {
      const visualHash = await computeVisualHashFromFile(filePath);
      const similar = findSimilarVisualHash(visualHash, visualCandidates, visualDuplicateThreshold);
      if (similar) {
        summary.skippedSimilar += 1;
        continue;
      }
    }

    const createdAsset = await prisma.projectAsset.create({
      data: {
        projectId: project.id,
        kind,
        storagePath: relativeStoragePath,
        publicUrl,
        originalFilename: path.basename(filePath),
        fileSize: Math.round(stat.size),
        checksum,
        status: 'active',
        sourceType: 'folder-sync',
        sourcePath: filePath,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    byStoragePath.set(relativeStoragePath, createdAsset);
    if (checksum) byChecksum.set(checksum, createdAsset);
    if (kind === 'image' && isImagePath(filePath)) {
      const visualHash = await computeVisualHashFromFile(filePath);
      if (visualHash) visualCandidates.push({ asset: createdAsset, visualHash });
    }
    summary.created += 1;
  }

  for (const asset of byStoragePath.values()) {
    if (!asset.storagePath) continue;
    if (seenStoragePaths.has(asset.storagePath)) continue;
    if (asset.status === 'missing' || asset.status === 'archived') continue;

    await prisma.projectAsset.update({
      where: { id: asset.id },
      data: {
        status: 'missing',
        updatedAt: new Date().toISOString(),
      },
    });
    summary.markedMissing += 1;
  }

  return summary;
}
