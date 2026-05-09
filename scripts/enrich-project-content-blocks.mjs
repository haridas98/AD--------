import fs from 'node:fs';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';

const APPLY = process.argv.includes('--apply');
const ONLY = (process.argv.find((arg) => arg.startsWith('--only=')) || '').slice('--only='.length);
const REPORT_DIR = process.env.CONTENT_REPORT_DIR || 'E:/AD/_audit';

const prisma = new PrismaClient();

function parseContent(content) {
  try {
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
}

function image(url, alt, assetId) {
  return { url, alt, assetId };
}

function uniqueImages(assets, title) {
  const seen = new Set();
  return assets
    .filter((asset) => asset.kind === 'image' && asset.status !== 'archived' && asset.publicUrl)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || String(a.originalFilename).localeCompare(String(b.originalFilename)))
    .filter((asset) => {
      if (seen.has(asset.publicUrl)) return false;
      seen.add(asset.publicUrl);
      return true;
    })
    .map((asset, index) => image(asset.publicUrl, asset.altText || `${title} photo ${index + 1}`, asset.id));
}

function categoryLabel(categoryId) {
  const labels = {
    kitchens: 'Kitchen',
    bathrooms: 'Bathroom',
    bathroom: 'Bathroom',
    'full-house-remodeling': 'Full house',
    'full-house': 'Full house',
    adu1: 'ADU',
    adu: 'ADU',
    fireplaces: 'Fireplace',
  };
  return labels[categoryId] || 'Residential';
}

function categorySeoPhrase(categoryId) {
  const phrases = {
    kitchens: 'kitchen remodel design',
    bathrooms: 'bathroom remodel design',
    bathroom: 'bathroom remodel design',
    'full-house-remodeling': 'full house remodeling design',
    'full-house': 'full house remodeling design',
    adu1: 'ADU interior design',
    adu: 'ADU interior design',
    fireplaces: 'fireplace design',
  };
  return phrases[categoryId] || 'interior design';
}

function articleFor(phrase) {
  return /^[aeiou]/i.test(phrase) ? 'an' : 'a';
}

function buildContent(project, assets) {
  const images = uniqueImages(assets, project.title);
  const hero = images[0];
  const category = categoryLabel(project.categoryId);
  const seoPhrase = categorySeoPhrase(project.categoryId);
  const locationText = project.cityName ? ` in ${project.cityName}` : '';
  const overview = `${project.title} is ${articleFor(seoPhrase)} ${seoPhrase}${locationText}. Real photos show the layout, materials, light, and details of the finished home.`;
  const designNote = `Simple lines, practical planning, and calm finishes guide this ${category.toLowerCase()} project.`;

  return [
    {
      id: 'project-hero',
      type: 'heroImage',
      data: {
        title: project.title,
        subtitle: `${category} project${locationText} by Alexandra Diz.`,
        image: hero?.url || '',
        alt: hero?.alt || project.title,
      },
    },
    {
      id: 'project-meta',
      type: 'metaInfo',
      data: {
        items: [
          { label: 'Category', value: category },
          project.cityName ? { label: 'Location', value: project.cityName } : null,
          project.year ? { label: 'Realized', value: String(project.year) } : null,
        ].filter(Boolean),
      },
    },
    {
      id: 'project-editorial-note',
      type: 'editorialNote',
      data: {
        eyebrow: 'Finished project',
        title: 'Real rooms before presentation.',
        note: designNote,
        image: images[1] || hero || null,
      },
    },
    {
      id: 'project-overview',
      type: 'typography',
      data: {
        title: 'Project overview',
        content: overview,
        size: 'md',
      },
    },
    {
      id: 'project-image-grid',
      type: 'imageGrid',
      data: {
        columns: images.length > 1 ? 2 : 1,
        images: images.slice(0, Math.min(8, images.length)),
      },
    },
    {
      id: 'project-side-by-side',
      type: 'sideBySide',
      data: {
        title: 'Material rhythm',
        text: `A ${seoPhrase} should feel clear in real life: good storage, balanced light, durable materials, and details that stay quiet.`,
        image: images[2] || images[0] || null,
        imagePosition: 'left',
      },
    },
    {
      id: 'project-slider',
      type: 'refinedSlider',
      data: {
        title: 'Project photos',
        description: 'Selected finished photographs from the project.',
        thumbnailPosition: 'bottom',
        images: images.slice(0, Math.min(10, images.length)),
      },
    },
    {
      id: 'project-mosaic',
      type: 'mosaicPreset',
      data: {
        title: 'Details in context',
        preset: images.length % 2 ? 'a' : 'b',
        images: images.slice(3, 7).length ? images.slice(3, 7) : images.slice(0, 4),
      },
    },
    {
      id: 'project-closing-note',
      type: 'typography',
      data: {
        title: 'What carries the space',
        content: `This ${category.toLowerCase()} keeps the focus on proportion, useful planning, and finished details. The result is easy to live with and easy to read.`,
        size: 'md',
      },
    },
    {
      id: 'project-cta',
      type: 'ctaSection',
      data: {
        title: 'Plan a similar project',
        text: `Planning a ${seoPhrase}${locationText}? Share the room, scope, and priorities.`,
        buttonText: 'Contact',
        buttonLink: '/contact',
        align: 'center',
      },
    },
  ].filter((block) => {
    if (block.type === 'sideBySide') return Boolean(block.data.image?.url);
    if (block.type === 'mosaicPreset') return Boolean(block.data.images?.length);
    if (block.type === 'imageGrid' || block.type === 'refinedSlider') return Boolean(block.data.images?.length);
    return true;
  });
}

function seoForProject(project) {
  const category = categoryLabel(project.categoryId);
  const seoPhrase = categorySeoPhrase(project.categoryId);
  const location = project.cityName || 'California';
  return {
    seoTitle: `${project.title} | ${category} Design in ${location} | Alexandra Diz`,
    seoDescription: `${project.title} is ${articleFor(seoPhrase)} ${seoPhrase} project in ${location} by Alexandra Diz, shown with real finished interior photos, materials, layout, and details.`,
    seoKeywords: [
      project.title,
      `${seoPhrase} ${location}`,
      `${category.toLowerCase()} design`,
      'Alexandra Diz',
      'California interior designer',
      'real project photos',
    ].filter(Boolean).join(', '),
  };
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
  const content = parseContent(project.content);
  const types = content.map((block) => block.type);
  const isThin = types.length <= 4 || !types.includes('metaInfo') || !types.includes('mosaicPreset') || !types.includes('sideBySide');
  const images = uniqueImages(project.assets, project.title);

  if (!isThin || !images.length) continue;

  const nextContent = buildContent(project, project.assets);
  const seo = seoForProject(project);
  if (APPLY) {
    await prisma.project.update({
      where: { id: project.id },
      data: {
        content: JSON.stringify(nextContent),
        seoTitle: project.seoTitle || seo.seoTitle,
        seoDescription: project.seoDescription || seo.seoDescription,
        seoKeywords: project.seoKeywords || seo.seoKeywords,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  report.push({
    title: project.title,
    slug: project.slug,
    images: images.length,
    from: types,
    to: nextContent.map((block) => block.type),
    seo,
  });
}

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(REPORT_DIR, 'project-content-enrichment.json'),
  JSON.stringify({ mode: APPLY ? 'APPLY' : 'DRY_RUN', projects: report }, null, 2),
  'utf8',
);

console.log(JSON.stringify({
  mode: APPLY ? 'APPLY' : 'DRY_RUN',
  projects: report.length,
}, null, 2));

await prisma.$disconnect();
