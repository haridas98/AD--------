import fs from 'node:fs';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';

import { normalizeSqliteDatabaseUrl } from '../database-url.mjs';
import { saveProjectAssetUpload } from '../lib/project-assets.js';
import { importProjectAssetsFromArchive } from '../lib/project-asset-migration.js';

const databaseUrl = process.env.DATABASE_URL || 'file:./server/prisma/dev.db';
process.env.DATABASE_URL = normalizeSqliteDatabaseUrl(databaseUrl, process.cwd());

const prisma = new PrismaClient();
const uploadsRoot = path.resolve('public/uploads');

function parseArgs(argv) {
  const args = {
    apply: false,
    sourceTypes: ['legacy-import', 'folder-sync'],
    threshold: Number(process.env.ASSET_VISUAL_DUPLICATE_THRESHOLD || 8) || 8,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--apply') args.apply = true;
    if (value === '--source-types') {
      args.sourceTypes = String(argv[index + 1] || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      index += 1;
    }
    if (value === '--threshold') {
      args.threshold = Number(argv[index + 1] || args.threshold) || args.threshold;
      index += 1;
    }
  }

  return args;
}

function sqliteFileFromUrl(url) {
  if (!String(url).startsWith('file:')) return '';
  return path.resolve(String(url).replace(/^file:/, ''));
}

function backupSqliteDatabase() {
  const dbPath = sqliteFileFromUrl(process.env.DATABASE_URL);
  if (!dbPath || !fs.existsSync(dbPath)) return '';

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${dbPath}.before-asset-rebuild-${stamp}.bak`;
  fs.copyFileSync(dbPath, backupPath);
  return backupPath;
}

function uploadPathFromAsset(asset) {
  if (!asset.storagePath) return '';
  const filePath = path.resolve(uploadsRoot, asset.storagePath);
  return filePath.startsWith(uploadsRoot) ? filePath : '';
}

async function removeAssetFiles(assets) {
  let removedFiles = 0;

  for (const asset of assets) {
    const filePath = uploadPathFromAsset(asset);
    if (!filePath || !fs.existsSync(filePath)) continue;
    await fs.promises.unlink(filePath);
    removedFiles += 1;
  }

  return removedFiles;
}

async function main() {
  const args = parseArgs(process.argv);
  const assets = await prisma.projectAsset.findMany({
    where: {
      sourceType: { in: args.sourceTypes },
    },
    include: {
      _count: { select: { usages: true } },
    },
  });

  const usageCount = assets.reduce((sum, asset) => sum + (asset._count?.usages || 0), 0);
  const fileCount = assets.filter((asset) => {
    const filePath = uploadPathFromAsset(asset);
    return filePath && fs.existsSync(filePath);
  }).length;

  console.log(`Mode: ${args.apply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Source types: ${args.sourceTypes.join(', ')}`);
  console.log(`Visual duplicate threshold: ${args.threshold}`);
  console.log(`Assets to rebuild: ${assets.length}`);
  console.log(`Asset usages to delete: ${usageCount}`);
  console.log(`Upload files to remove: ${fileCount}`);

  if (!args.apply) {
    console.log('Nothing changed. Re-run with --apply to rebuild.');
    return;
  }

  const backupPath = backupSqliteDatabase();
  if (backupPath) console.log(`DB backup: ${backupPath}`);

  const assetIds = assets.map((asset) => asset.id);
  if (assetIds.length) {
    await prisma.projectAssetUsage.deleteMany({
      where: {
        assetId: { in: assetIds },
      },
    });
    await prisma.projectAsset.deleteMany({
      where: {
        id: { in: assetIds },
      },
    });
  }

  const removedFiles = await removeAssetFiles(assets);
  console.log(`Removed upload files: ${removedFiles}`);

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
  });

  let imported = 0;
  let skipped = 0;
  let skippedSimilar = 0;

  for (const project of projects) {
    const result = await importProjectAssetsFromArchive({
      prisma,
      project,
      uploadsRoot,
      saveProjectAssetUpload,
      visualDuplicateThreshold: args.threshold,
    });
    imported += result.created;
    skipped += result.skipped;
    skippedSimilar += result.skippedSimilar || 0;
    console.log(`${project.title}: imported ${result.created}, exact skipped ${result.skipped}, similar skipped ${result.skippedSimilar || 0}`);
  }

  console.log(`Done. Imported: ${imported}. Exact skipped: ${skipped}. Similar skipped: ${skippedSimilar}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
