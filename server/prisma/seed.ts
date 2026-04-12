import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function toSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function main() {
  console.log('Seeding database...');

  const dataPath = path.resolve('data/content.json');
  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Create categories
  for (const cat of rawData.categories) {
    await prisma.category.upsert({
      where: { slug: cat.id },
      update: {},
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.id,
        showInHeader: true,
        sortOrder: 0,
      },
    });
    console.log(`Category: ${cat.name}`);
  }

  // Create projects with content blocks
  for (const proj of rawData.projects) {
    const slug = proj.slug || toSlug(proj.title);

    // Build content blocks from legacy data
    const contentBlocks = [];

    // Hero block (if coverImage exists)
    if (proj.coverImage) {
      contentBlocks.push({
        type: 'heroImage',
        data: {
          image: proj.coverImage,
          alt: proj.title,
          title: proj.title,
          subtitle: proj.summary,
        },
      });
    }

    // Meta block (location, year)
    const metaInfo = [];
    if (proj.location) metaInfo.push({ label: 'Location', value: proj.location });
    if (proj.year) metaInfo.push({ label: 'Year', value: proj.year });
    if (metaInfo.length > 0) {
      contentBlocks.push({
        type: 'metaInfo',
        data: { items: metaInfo },
      });
    }

    // Description block (if workDone exists)
    if (proj.workDone) {
      contentBlocks.push({
        type: 'typography',
        data: { title: 'What was done', content: proj.workDone },
      });
    }

    // Gallery block
    if (proj.gallery && proj.gallery.length > 0) {
      contentBlocks.push({
        type: 'imageGrid',
        data: { images: proj.gallery.map((url) => ({ url, alt: proj.title })) },
      });
    }

    await prisma.project.upsert({
      where: { slug },
      update: {},
      create: {
        id: proj.id,
        title: proj.title,
        slug,
        categoryId: proj.categoryId,
        isFeatured: proj.featuredOnHome || false,
        isPublished: proj.published !== false,
        content: JSON.stringify(contentBlocks),
        seoTitle: proj.title,
        seoDescription: proj.summary,
      },
    });
    console.log(`Project: ${proj.title}`);
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
