import { PrismaClient } from '@prisma/client';

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node scripts/delete-project-assets-by-slug.mjs <project-slug>');
  process.exit(1);
}

const prisma = new PrismaClient();
const project = await prisma.project.findUnique({
  where: { slug },
  include: { assets: true },
});

if (!project) {
  console.error(`Project not found: ${slug}`);
  process.exit(1);
}

const assetIds = project.assets.map((asset) => asset.id);

if (assetIds.length) {
  await prisma.projectAssetUsage.deleteMany({
    where: { assetId: { in: assetIds } },
  });
  await prisma.projectAsset.deleteMany({
    where: { id: { in: assetIds } },
  });
}

console.log(JSON.stringify({ project: project.title, slug, removed: assetIds.length }));
await prisma.$disconnect();
