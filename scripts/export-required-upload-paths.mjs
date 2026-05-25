import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const uploadUrlPattern = /\/uploads\/projects\/[^\s"'<>)}]+/g;

function cleanUploadPath(value) {
  return String(value || '').split('?')[0].replace(/^\/uploads\//, '');
}

function collectUploadUrls(value, paths) {
  if (!value) return;
  if (typeof value === 'string') {
    for (const match of value.matchAll(uploadUrlPattern)) {
      paths.add(cleanUploadPath(match[0]));
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectUploadUrls(item, paths));
    return;
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((item) => collectUploadUrls(item, paths));
  }
}

const paths = new Set();
const projects = await prisma.project.findMany({
  where: { deletedAt: null },
  include: {
    assets: {
      where: { kind: 'image', status: 'active' },
    },
  },
});

for (const project of projects) {
  for (const asset of project.assets) {
    if (asset.storagePath) paths.add(asset.storagePath);
    else if (asset.publicUrl) paths.add(cleanUploadPath(asset.publicUrl));
  }

  if (project.coverImage) paths.add(cleanUploadPath(project.coverImage));

  try {
    collectUploadUrls(JSON.parse(project.content || '[]'), paths);
  } catch {
    collectUploadUrls(project.content || '', paths);
  }
}

console.log([...paths].filter(Boolean).sort().join('\n'));
await prisma.$disconnect();
