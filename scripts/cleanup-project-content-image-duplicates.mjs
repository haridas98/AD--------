import fs from 'node:fs';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';

const APPLY = process.argv.includes('--apply');
const ONLY = (process.argv.find((arg) => arg.startsWith('--only=')) || '').slice('--only='.length);
const REPORT_DIR = process.env.DUPE_REPORT_DIR || 'E:/AD/_audit';

const prisma = new PrismaClient();

function parseContent(content) {
  try {
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
}

function imageKey(image) {
  return image?.assetId || image?.url || image?.image || '';
}

function dedupeImages(images) {
  if (!Array.isArray(images)) return { images, removed: 0 };
  const seen = new Set();
  const next = [];
  let removed = 0;

  for (const image of images) {
    const key = imageKey(image);
    if (key && seen.has(key)) {
      removed += 1;
      continue;
    }
    if (key) seen.add(key);
    next.push(image);
  }

  return { images: next, removed };
}

function cleanupBlock(block) {
  if (!block?.data || typeof block.data !== 'object') return { block, removed: 0 };

  let removed = 0;
  const data = { ...block.data };

  if (Array.isArray(data.images)) {
    const result = dedupeImages(data.images);
    data.images = result.images;
    removed += result.removed;
  }

  if (Array.isArray(data.items)) {
    data.items = data.items.map((item) => {
      if (!Array.isArray(item?.images)) return item;
      const result = dedupeImages(item.images);
      removed += result.removed;
      return { ...item, images: result.images };
    });
  }

  return { block: { ...block, data }, removed };
}

const projects = await prisma.project.findMany({
  where: {
    deletedAt: null,
    ...(ONLY ? { slug: ONLY } : {}),
  },
});

const report = [];

for (const project of projects) {
  const content = parseContent(project.content);
  let removed = 0;
  const nextContent = content.map((block) => {
    const result = cleanupBlock(block);
    removed += result.removed;
    return result.block;
  });

  if (!removed) continue;

  if (APPLY) {
    await prisma.project.update({
      where: { id: project.id },
      data: {
        content: JSON.stringify(nextContent),
        updatedAt: new Date().toISOString(),
      },
    });
  }

  report.push({
    title: project.title,
    slug: project.slug,
    removed,
  });
}

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(REPORT_DIR, 'project-content-image-duplicate-cleanup.json'),
  JSON.stringify({ mode: APPLY ? 'APPLY' : 'DRY_RUN', projects: report }, null, 2),
  'utf8',
);

console.log(JSON.stringify({
  mode: APPLY ? 'APPLY' : 'DRY_RUN',
  projects: report.length,
  removed: report.reduce((sum, item) => sum + item.removed, 0),
}, null, 2));

await prisma.$disconnect();
