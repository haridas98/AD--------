import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { normalizeSqliteDatabaseUrl } from '../server/database-url.mjs';
import { readHomepageSettingsFromDb, writeHomepageSettingsToDb } from '../server/homepage-settings.js';

const APPLY = process.argv.includes('--apply');
const UPDATE_HOMEPAGE = !process.argv.includes('--skip-homepage');
const OVERWRITE_ALT = process.argv.includes('--overwrite-alt');
const OVERWRITE_SEO = process.argv.includes('--overwrite-seo');
const ARCHIVE_CHECKSUM_DUPES = process.argv.includes('--archive-checksum-duplicates');
const ONLY = (process.argv.find((arg) => arg.startsWith('--only=')) || '').slice('--only='.length).trim();
const REPORT_DIR = process.env.CONTENT_REPORT_DIR || 'E:/AD/_audit';

function readLocalEnvFile() {
  const envPath = path.resolve('.env');
  if (!fs.existsSync(envPath)) return {};

  const values = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    values[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return values;
}

const localEnv = readLocalEnvFile();
const databaseUrl = process.env.DATABASE_URL || localEnv.DATABASE_URL || '';
if (databaseUrl) process.env.DATABASE_URL = normalizeSqliteDatabaseUrl(databaseUrl, process.cwd());

function timestamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
}

function backupSqliteDatabase() {
  if (!APPLY || !process.env.DATABASE_URL?.startsWith('file:')) return '';
  const dbPath = path.resolve(process.env.DATABASE_URL.replace(/^file:/, ''));
  if (!fs.existsSync(dbPath)) return '';
  const backupPath = `${dbPath}.before-seo-assets-${timestamp()}.bak`;
  fs.copyFileSync(dbPath, backupPath);
  return backupPath;
}

const categoryLabels = {
  kitchens: 'kitchen',
  bathrooms: 'bathroom',
  bathroom: 'bathroom',
  'full-house-remodeling': 'home remodel',
  'full-house': 'home remodel',
  adu1: 'ADU interior',
  adu: 'ADU interior',
  fireplaces: 'fireplace',
};

const categorySeo = {
  kitchens: 'kitchen remodel design',
  bathrooms: 'bathroom remodel design',
  bathroom: 'bathroom remodel design',
  'full-house-remodeling': 'full house remodeling design',
  'full-house': 'full house remodeling design',
  adu1: 'ADU interior design',
  adu: 'ADU interior design',
  fireplaces: 'fireplace design',
};

const negativeTerms = [
  'render',
  '3d',
  'visual',
  'concept',
  'sketch',
  'drawing',
  'plan',
  'elevation',
  'before',
  'after',
  'progress',
  'construction',
  'demo',
  'site visit',
  'portrait',
  'people',
  'person',
  'client',
  'family',
  'logo',
  'screenshot',
  'whatsapp',
  'low res',
];

const positiveTerms = [
  'finished',
  'final',
  'photo',
  'photos',
  'high res',
  'high-res',
  'no logo',
  'alexandradiz',
];

function parseContent(content) {
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content || '[]') : content;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function categoryKey(project) {
  return project.category?.slug || project.categoryId || '';
}

function categoryLabel(project) {
  const key = categoryKey(project);
  return categoryLabels[key] || String(project.category?.name || 'interior').toLowerCase();
}

function categorySeoPhrase(project) {
  const key = categoryKey(project);
  return categorySeo[key] || 'interior design';
}

function projectNoun(project) {
  const label = categoryLabel(project);
  const title = String(project.title || '').toLowerCase();
  if (label === 'kitchen' && title.includes('kitchen')) return 'project';
  if (label === 'bathroom' && title.includes('bath')) return 'project';
  if (label === 'fireplace' && title.includes('fireplace')) return 'project';
  if (label === 'home remodel' && /\b(home|house)\b/.test(title)) return 'remodel project';
  if (label === 'ADU interior' && /\badu\b/i.test(title)) return 'project';
  return `${label} project`;
}

function qualityScore(asset) {
  const width = Number(asset.width || 0);
  const height = Number(asset.height || 0);
  const ratio = width && height ? width / height : 0;
  const megapixels = width && height ? (width * height) / 1_000_000 : 0;
  const haystack = `${asset.originalFilename || ''} ${asset.sourcePath || ''} ${asset.publicUrl || ''}`.toLowerCase();
  let score = 1000;

  if (asset.sourceType === 'legacy-import' || asset.sourceType === 'folder-sync') score += 80;
  if (ratio >= 1.15 && ratio <= 1.9) score += 240;
  else if (ratio >= 1.0 && ratio < 1.15) score += 120;
  else if (ratio >= 0.75 && ratio < 1.0) score -= 60;
  else if (ratio > 2.35 || (ratio > 0 && ratio < 0.75)) score -= 180;

  score += Math.min(180, Math.round(megapixels * 28));
  score += Math.min(80, Math.round(Number(asset.fileSize || 0) / 180000));

  for (const term of positiveTerms) {
    if (haystack.includes(term)) score += 35;
  }
  for (const term of negativeTerms) {
    if (haystack.includes(term)) score -= 180;
  }

  return score;
}

function sortAssets(assets) {
  return [...assets].sort((a, b) => {
    const scoreDiff = qualityScore(b) - qualityScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    const areaDiff = Number(b.width || 0) * Number(b.height || 0) - Number(a.width || 0) * Number(a.height || 0);
    if (areaDiff !== 0) return areaDiff;
    return String(a.originalFilename || '').localeCompare(String(b.originalFilename || ''));
  });
}

function buildAlt(project, asset, index = 0) {
  const noun = projectNoun(project);
  const location = project.cityName ? ` in ${project.cityName}` : '';
  const suffix = index > 0 ? `, view ${index + 1}` : '';
  return `${project.title} ${noun}${location}${suffix} by Alexandra Diz`;
}

function buildCaption(project, asset, index = 0) {
  const noun = projectNoun(project);
  const location = project.cityName ? ` in ${project.cityName}` : '';
  return `Finished ${noun} photo${location}, ${project.title}, view ${index + 1}.`;
}

function buildSeo(project) {
  const phrase = categorySeoPhrase(project);
  const location = project.cityName || 'California';
  return {
    seoTitle: `${project.title} | ${phrase} in ${location} | Alexandra Diz`.slice(0, 80),
    seoDescription: `${project.title} is a ${phrase} project in ${location} by Alexandra Diz, shown with finished interior photos, materials, layout, and details.`.slice(0, 180),
    seoKeywords: [project.title, `${phrase} ${location}`, 'Alexandra Diz', 'California interior designer', 'finished interior photos'].join(', '),
  };
}

function getUrl(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value.url || value.image || '';
  return '';
}

function updateImageValue(value, assetByUrl, orderByUrl, project) {
  const url = getUrl(value);
  if (!url) return value;
  const asset = assetByUrl.get(url);
  if (!asset) return value;
  const alt = buildAlt(project, asset, orderByUrl.get(url) || 0);
  if (typeof value === 'string') return { url, alt, assetId: asset.id };
  return { ...value, url, alt: value.alt || alt, assetId: value.assetId || asset.id };
}

function sortImageArray(images, assetByUrl, orderByUrl, project) {
  const seen = new Set();
  return images
    .map((image, index) => ({ image: updateImageValue(image, assetByUrl, orderByUrl, project), index }))
    .filter(({ image }) => {
      const url = getUrl(image);
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    })
    .sort((a, b) => {
      const aOrder = orderByUrl.get(getUrl(a.image));
      const bOrder = orderByUrl.get(getUrl(b.image));
      if (aOrder == null && bOrder == null) return a.index - b.index;
      if (aOrder == null) return 1;
      if (bOrder == null) return -1;
      return aOrder - bOrder;
    })
    .map(({ image }) => image);
}

function replaceHeroImage(data, bestAsset, project) {
  if (!bestAsset) return data;
  const alt = buildAlt(project, bestAsset, 0);
  const current = data.image;
  const image = current && typeof current === 'object'
    ? { ...current, url: bestAsset.publicUrl, alt, assetId: bestAsset.id }
    : bestAsset.publicUrl;
  return { ...data, image, alt };
}

function updateBlock(block, bestAsset, assetByUrl, orderByUrl, project) {
  const data = { ...(block.data || {}) };

  if (block.type === 'heroImage') {
    return { ...block, data: replaceHeroImage(data, bestAsset, project) };
  }

  if (Array.isArray(data.images)) {
    data.images = sortImageArray(data.images, assetByUrl, orderByUrl, project);
  }

  if (data.image) {
    data.image = updateImageValue(data.image, assetByUrl, orderByUrl, project);
    if (!data.alt) {
      const asset = assetByUrl.get(getUrl(data.image));
      if (asset) data.alt = buildAlt(project, asset, orderByUrl.get(asset.publicUrl) || 0);
    }
  }

  if (data.beforeImage) data.beforeImage = updateImageValue(data.beforeImage, assetByUrl, orderByUrl, project);
  if (data.afterImage) data.afterImage = updateImageValue(data.afterImage, assetByUrl, orderByUrl, project);

  if (Array.isArray(data.items)) {
    data.items = data.items.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const next = { ...item };
      if (next.image) next.image = updateImageValue(next.image, assetByUrl, orderByUrl, project);
      if (Array.isArray(next.images)) {
        next.images = next.images.map((image) => updateImageValue(image, assetByUrl, orderByUrl, project));
      }
      return next;
    });
  }

  return { ...block, data };
}

function collectAssetUsages(project, blocks, assetByUrl) {
  const usages = [];
  const now = new Date().toISOString();

  function walk(value, pathParts, block) {
    const url = getUrl(value);
    if (url && assetByUrl.has(url)) {
      const asset = assetByUrl.get(url);
      usages.push({
        projectId: project.id,
        assetId: asset.id,
        blockId: block.id || null,
        slotKey: pathParts.join('.').slice(0, 180),
        usageType: block.type || null,
        sortOrder: usages.length,
        createdAt: now,
        updatedAt: now,
      });
      if (value && typeof value === 'object' && !Array.isArray(value) && ('url' in value || 'image' in value)) return;
    }

    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, [...pathParts, String(index)], block));
      return;
    }
    Object.entries(value).forEach(([key, item]) => walk(item, [...pathParts, key], block));
  }

  blocks.forEach((block, blockIndex) => walk(block.data || {}, [`block:${blockIndex}`], block));
  const seen = new Set();
  return usages.filter((usage) => {
    const key = `${usage.assetId}:${usage.blockId}:${usage.slotKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function checksumDuplicateIds(assets) {
  const byChecksum = new Map();
  for (const asset of assets) {
    if (!asset.checksum) continue;
    const group = byChecksum.get(asset.checksum) || [];
    group.push(asset);
    byChecksum.set(asset.checksum, group);
  }

  const archiveIds = [];
  for (const group of byChecksum.values()) {
    if (group.length < 2) continue;
    const sorted = sortAssets(group);
    archiveIds.push(...sorted.slice(1).map((asset) => asset.id));
  }
  return archiveIds;
}

function projectRank(project) {
  const activeAssets = (project.assets || []).filter((asset) => asset.kind === 'image' && asset.status === 'active');
  const best = sortAssets(activeAssets)[0];
  return Number(project.isFeatured) * 10000 + activeAssets.length * 100 + (best ? qualityScore(best) / 10 : 0);
}

function sectionForProject(project) {
  const key = categoryKey(project);
  if (key === 'kitchens') return 'kitchens';
  if (key === 'bathrooms' || key === 'bathroom') return 'bathrooms';
  if (key === 'full-house-remodeling' || key === 'full-house') return 'full-house';
  if (key === 'adu1' || key === 'adu') return 'adu';
  if (key === 'fireplaces') return 'fireplaces';
  return 'other';
}

function pickHomepageImage(project, usedUrls) {
  const asset = sortAssets((project.assets || []).filter((item) => item.kind === 'image' && item.status === 'active' && item.publicUrl))
    .find((item) => !usedUrls.has(item.publicUrl));
  if (!asset) return null;
  usedUrls.add(asset.publicUrl);
  return {
    url: asset.publicUrl,
    assetId: asset.id,
    projectId: project.id,
    alt: buildAlt(project, asset, 0),
  };
}

async function updateHomepage(prisma, projects) {
  const settings = await readHomepageSettingsFromDb(prisma);
  const usedUrls = new Set();
  const sorted = [...projects].sort((a, b) => projectRank(b) - projectRank(a));
  const kitchenProjects = sorted.filter((project) => sectionForProject(project) === 'kitchens');
  const bathroomProjects = sorted.filter((project) => sectionForProject(project) === 'bathrooms');
  const otherProjects = sorted.filter((project) => !['kitchens', 'bathrooms'].includes(sectionForProject(project)));

  const kitchenImages = kitchenProjects.map((project) => pickHomepageImage(project, usedUrls)).filter(Boolean).slice(0, 6);
  const bathroomImages = bathroomProjects.map((project) => pickHomepageImage(project, usedUrls)).filter(Boolean).slice(0, 8);
  const detailImages = [...otherProjects, ...bathroomProjects]
    .map((project) => pickHomepageImage(project, usedUrls))
    .filter(Boolean)
    .slice(0, 12);

  const nextSettings = {
    ...settings,
    collage: {
      ...settings.collage,
      title: 'Kitchens made to be used.',
      text: 'Different kitchen projects with real finished photos: storage, light, work surfaces, and daily rhythm.',
      quote: 'Real kitchens should look calm and work hard.',
      cardTitle: 'Live kitchen rhythm',
      cardText: 'Finished kitchens, natural light, and materials already doing their job.',
      images: {
        primary: kitchenImages[0] || settings.collage.images.primary,
        smallOne: kitchenImages[1] || settings.collage.images.smallOne,
        wide: kitchenImages[2] || settings.collage.images.wide,
        tall: kitchenImages[3] || settings.collage.images.tall,
        smallTwo: kitchenImages[4] || settings.collage.images.smallTwo,
      },
    },
    showcase: {
      ...settings.showcase,
      label: 'Bathrooms',
      title: 'Quiet bathrooms with real texture.',
      projectCount: Math.max(1, Math.min(12, bathroomImages.length || settings.showcase.projectCount || 8)),
    },
    approach: {
      ...settings.approach,
      label: 'Kitchen ideas',
      title: 'Bring the idea to the heat.',
      image: kitchenImages[5] || kitchenImages[0] || settings.approach.image,
    },
    detail: {
      ...settings.detail,
      label: 'Detail motion',
      title: 'Best live projects, one detail at a time.',
      images: detailImages.length ? detailImages : settings.detail.images,
    },
  };

  if (APPLY) await writeHomepageSettingsToDb(prisma, nextSettings);
  return {
    kitchenImages: kitchenImages.length,
    bathroomImages: bathroomImages.length,
    detailImages: detailImages.length,
  };
}

const prisma = new PrismaClient();
const databaseBackup = backupSqliteDatabase();
const report = {
  mode: APPLY ? 'APPLY' : 'DRY_RUN',
  databaseBackup,
  projects: [],
  homepage: null,
};

const projects = await prisma.project.findMany({
  where: {
    deletedAt: null,
    ...(ONLY ? { OR: [{ id: ONLY }, { slug: ONLY }] } : {}),
  },
  include: {
    category: true,
    assets: {
      where: { kind: 'image', status: 'active' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    },
  },
  orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
});

for (const project of projects) {
  const orderedAssets = sortAssets(project.assets || []);
  if (!orderedAssets.length) continue;

  const assetByUrl = new Map(orderedAssets.map((asset) => [asset.publicUrl, asset]));
  const orderByUrl = new Map(orderedAssets.map((asset, index) => [asset.publicUrl, index]));
  const bestAsset = orderedAssets[0];
  const blocks = parseContent(project.content);
  const nextBlocks = blocks.map((block) => updateBlock(block, bestAsset, assetByUrl, orderByUrl, project));
  const seo = buildSeo(project);
  const duplicateIds = checksumDuplicateIds(orderedAssets);
  const usages = collectAssetUsages(project, nextBlocks, assetByUrl);

  const changedAssets = [];
  for (const [index, asset] of orderedAssets.entries()) {
    const nextAlt = buildAlt(project, asset, index);
    const nextCaption = buildCaption(project, asset, index);
    const nextSortOrder = index + 1;
    const assetData = {
      sortOrder: nextSortOrder,
      altText: OVERWRITE_ALT || !asset.altText ? nextAlt : asset.altText,
      caption: OVERWRITE_ALT || !asset.caption ? nextCaption : asset.caption,
      updatedAt: new Date().toISOString(),
    };

    if (
      asset.sortOrder !== nextSortOrder ||
      asset.altText !== assetData.altText ||
      asset.caption !== assetData.caption
    ) {
      changedAssets.push(asset.id);
      if (APPLY) await prisma.projectAsset.update({ where: { id: asset.id }, data: assetData });
    }
  }

  if (APPLY && ARCHIVE_CHECKSUM_DUPES && duplicateIds.length) {
    await prisma.projectAsset.updateMany({
      where: { id: { in: duplicateIds } },
      data: { status: 'archived', includeInAi: false, updatedAt: new Date().toISOString() },
    });
  }

  const contentChanged = JSON.stringify(nextBlocks) !== JSON.stringify(blocks);
  const projectData = {
    content: contentChanged ? JSON.stringify(nextBlocks) : undefined,
    seoTitle: OVERWRITE_SEO || !project.seoTitle ? seo.seoTitle : project.seoTitle,
    seoDescription: OVERWRITE_SEO || !project.seoDescription ? seo.seoDescription : project.seoDescription,
    seoKeywords: OVERWRITE_SEO || !project.seoKeywords ? seo.seoKeywords : project.seoKeywords,
    updatedAt: new Date().toISOString(),
  };
  Object.keys(projectData).forEach((key) => projectData[key] === undefined && delete projectData[key]);

  if (APPLY && (contentChanged || projectData.seoTitle !== project.seoTitle || projectData.seoDescription !== project.seoDescription || projectData.seoKeywords !== project.seoKeywords)) {
    await prisma.project.update({ where: { id: project.id }, data: projectData });
  }

  if (APPLY) {
    await prisma.projectAssetUsage.deleteMany({ where: { projectId: project.id } });
    if (usages.length) await prisma.projectAssetUsage.createMany({ data: usages });
  }

  report.projects.push({
    title: project.title,
    slug: project.slug,
    category: project.category?.name || project.categoryId,
    cityName: project.cityName,
    assets: orderedAssets.length,
    bestAsset: {
      filename: bestAsset.originalFilename,
      publicUrl: bestAsset.publicUrl,
      width: bestAsset.width,
      height: bestAsset.height,
      score: qualityScore(bestAsset),
    },
    changedAssets: changedAssets.length,
    contentChanged,
    usages: usages.length,
    checksumDuplicates: duplicateIds.length,
  });
}

if (UPDATE_HOMEPAGE) {
  report.homepage = await updateHomepage(prisma, projects);
}

fs.mkdirSync(REPORT_DIR, { recursive: true });
const reportPath = path.join(REPORT_DIR, 'project-seo-assets-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

console.log(JSON.stringify({
  mode: report.mode,
  projects: report.projects.length,
  contentChanged: report.projects.filter((project) => project.contentChanged).length,
  changedAssets: report.projects.reduce((sum, project) => sum + project.changedAssets, 0),
  checksumDuplicates: report.projects.reduce((sum, project) => sum + project.checksumDuplicates, 0),
  homepage: report.homepage,
  reportPath,
  databaseBackup,
}, null, 2));

await prisma.$disconnect();
