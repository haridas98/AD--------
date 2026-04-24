import path from 'node:path';

import { PrismaClient } from '@prisma/client';

import { normalizeSqliteDatabaseUrl } from '../database-url.mjs';
import { saveProjectAssetUpload } from '../lib/project-assets.js';
import {
  hydrateProjectAssetsFromContent,
  importProjectAssetsFromArchive,
} from '../lib/project-asset-migration.js';

const databaseUrl = process.env.DATABASE_URL || 'file:./server/prisma/dev.db';
process.env.DATABASE_URL = normalizeSqliteDatabaseUrl(databaseUrl, process.cwd());

const prisma = new PrismaClient();
const uploadsRoot = path.resolve('public/uploads');
const visualDuplicateThreshold = Number(process.env.ASSET_VISUAL_DUPLICATE_THRESHOLD || 8) || 8;

async function main() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
  });

  let imported = 0;
  let hydrated = 0;
  let skippedSimilar = 0;

  for (const project of projects) {
    const archiveResult = await importProjectAssetsFromArchive({
      prisma,
      project,
      uploadsRoot,
      saveProjectAssetUpload,
      visualDuplicateThreshold,
    });

    const hydrateResult = await hydrateProjectAssetsFromContent({
      prisma,
      project,
      uploadsRoot,
    });

    imported += archiveResult.created;
    skippedSimilar += archiveResult.skippedSimilar || 0;
    hydrated += hydrateResult.created;

    console.log(
      `${project.title}: archive +${archiveResult.created}, similar skipped ${archiveResult.skippedSimilar || 0}, block-hydrate +${hydrateResult.created}`,
    );
  }

  console.log(`Done. Imported from archive: ${imported}. Similar skipped: ${skippedSimilar}. Imported from block URLs: ${hydrated}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
