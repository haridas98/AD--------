import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { collectProjectAssetUsages } from '../server/lib/project-image-seo.js';

const prisma = new PrismaClient();
const legacyRoot = path.resolve('public/legacy');
const categoryIndexFiles = [
  'index.html',
  'kitchens/index.html',
  'full-house-remodeling/index.html',
  'bathrooms/index.html',
  'adu1/index.html',
  'fireplaces/index.html',
];

function normalizeSlug(value) {
  return String(value || '')
    .replace(/^https?:\/\/alexandradiz\.com\/?/i, '')
    .replace(/^\/+|\/+$/g, '')
    .trim()
    .toLowerCase();
}

function hashFrom(value) {
  const matches = String(value || '').match(/[a-f0-9]{24,64}/gi);
  return matches?.at(-1)?.toLowerCase() || '';
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function parseListingCovers() {
  const covers = new Map();
  let order = 0;

  for (const relativeFile of categoryIndexFiles) {
    const html = readText(path.join(legacyRoot, relativeFile));
    if (!html) continue;

    const cardRegex = /<a\b[^>]*href=["']([^"']+)["'][\s\S]*?data-file-name=["']([^"']+)["']/gi;
    for (const match of html.matchAll(cardRegex)) {
      const slug = normalizeSlug(match[1]);
      const hash = hashFrom(match[2]);
      if (!slug || !hash || covers.has(slug)) continue;
      covers.set(slug, {
        slug,
        hash,
        file: match[2],
        source: relativeFile.replace(/\\/g, '/'),
        order: order++,
      });
    }
  }

  return covers;
}

function walkIndexFiles(root) {
  const files = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      else if (entry.isFile() && entry.name.toLowerCase() === 'index.html') files.push(fullPath);
    }
  }
  return files;
}

function parseProjectPhotoOrder() {
  const bySlug = new Map();

  for (const filePath of walkIndexFiles(legacyRoot)) {
    const relative = path.relative(legacyRoot, filePath).replace(/\\/g, '/');
    if (categoryIndexFiles.includes(relative)) continue;

    const slug = normalizeSlug(path.basename(path.dirname(filePath)));
    if (!slug) continue;

    const html = readText(filePath);
    const photosStart = html.indexOf('"photos"');
    if (photosStart === -1) continue;

    const section = html.slice(photosStart);
    const files = [];
    for (const match of section.matchAll(/"file"\s*:\s*"([^"]+)"/gi)) {
      const hash = hashFrom(match[1]);
      if (!hash) continue;
      files.push({ file: match[1], hash });
    }

    const unique = [];
    const seen = new Set();
    for (const item of files) {
      if (seen.has(item.hash)) continue;
      seen.add(item.hash);
      unique.push(item);
    }

    if (unique.length) bySlug.set(slug, { slug, relative, photos: unique });
  }

  return bySlug;
}

function imageValue(asset, fallbackAlt) {
  return {
    url: asset.publicUrl,
    alt: asset.altText || fallbackAlt || asset.originalFilename || '',
    assetId: asset.id,
  };
}

function checksum(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function extensionFrom(filename) {
  const ext = path.extname(String(filename || '')).toLowerCase();
  return ext && ext.length <= 6 ? ext : '.jpg';
}

function mimeFromExt(ext) {
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function projectUploadSlug(project) {
  const first = project.assets.find((asset) => asset.storagePath?.startsWith('projects/'));
  if (first) return first.storagePath.split('/')[1];
  return normalizeSlug(project.slug) || project.slug;
}

async function downloadCoverAsset(project, cover) {
  const ext = extensionFrom(cover.file);
  const uploadSlug = projectUploadSlug(project);
  const filename = `legacy-cover-${cover.hash}${ext}`;
  const storagePath = `projects/${uploadSlug}/images/original/${filename}`;
  const publicUrl = `/uploads/${storagePath}`;
  const originalPath = path.resolve('public/uploads', storagePath);
  const derivedPath = path.resolve('public/uploads', `projects/${uploadSlug}/images/derived/legacy-cover-${cover.hash}-preview.webp`);

  fs.mkdirSync(path.dirname(originalPath), { recursive: true });
  fs.mkdirSync(path.dirname(derivedPath), { recursive: true });

  const baseUrl = 'https://static-cdn4-2.vigbo.tech/u54940/67783/preview';
  const candidates = [
    `${baseUrl}/${cover.file}`,
    `${baseUrl}/1000-${cover.file}`,
    `${baseUrl}/2000-${cover.file}`,
  ];
  let response = null;
  let url = '';
  for (const candidate of candidates) {
    const nextResponse = await fetch(candidate);
    if (nextResponse.ok) {
      response = nextResponse;
      url = candidate;
      break;
    }
  }
  if (!response) throw new Error(`Cover download failed: ${candidates.join(', ')}`);

  const sourceBuffer = Buffer.from(await response.arrayBuffer());
  const normalizedBuffer = await sharp(sourceBuffer)
    .rotate()
    .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(originalPath, normalizedBuffer);

  await sharp(normalizedBuffer)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 76 })
    .toFile(derivedPath);

  const now = new Date().toISOString();
  const data = {
    kind: 'image',
    publicUrl,
    originalFilename: filename,
    mimeType: mimeFromExt(ext),
    fileSize: normalizedBuffer.length,
    checksum: checksum(normalizedBuffer),
    status: 'active',
    includeInAi: false,
    sourceType: 'legacy-cover',
    sourcePath: url,
    altText: `${project.title} project cover by Alexandra Diz`,
    sortOrder: -1,
    updatedAt: now,
  };

  const existing = await prisma.projectAsset.findUnique({
    where: { projectId_storagePath: { projectId: project.id, storagePath } },
  });

  return existing
    ? prisma.projectAsset.update({ where: { id: existing.id }, data })
    : prisma.projectAsset.create({
        data: {
          projectId: project.id,
          storagePath,
          createdAt: now,
          ...data,
        },
      });
}

function replaceScalarImage(data, key, altKey, assetIdKey, assets, cursor, fallbackAlt) {
  if (!data || !data[key]) return cursor;
  const asset = assets[cursor];
  if (!asset) return cursor;
  data[key] = asset.publicUrl;
  if (altKey) data[altKey] = asset.altText || fallbackAlt || '';
  if (assetIdKey) data[assetIdKey] = asset.id;
  return cursor + 1;
}

function replaceImageArray(data, key, assets, cursor, fallbackAlt) {
  if (!data || !Array.isArray(data[key]) || !data[key].length) return cursor;
  const next = [];
  for (let index = 0; index < data[key].length; index += 1) {
    const asset = assets[cursor + index];
    if (!asset) break;
    next.push(imageValue(asset, fallbackAlt));
  }
  if (next.length) data[key] = next;
  return cursor + next.length;
}

function retargetBlocks(project, blocks, assets) {
  let cursor = 0;
  const fallbackAlt = `${project.title} by Alexandra Diz`;

  return blocks.map((block) => {
    const data = { ...(block.data || {}) };

    if (block.type === 'heroImage') {
      cursor = replaceScalarImage(data, 'image', 'alt', 'assetId', assets, cursor, fallbackAlt);
    } else if (block.type === 'editorialNote' || block.type === 'sideBySide') {
      cursor = replaceScalarImage(data, 'image', 'alt', 'assetId', assets, cursor, fallbackAlt);
    } else if (block.type === 'beforeAfter') {
      cursor = replaceScalarImage(data, 'beforeImage', 'beforeAlt', 'beforeAssetId', assets, cursor, fallbackAlt);
      cursor = replaceScalarImage(data, 'afterImage', 'afterAlt', 'afterAssetId', assets, cursor, fallbackAlt);
    } else if (block.type === 'imageGrid' || block.type === 'refinedSlider' || block.type === 'mosaicPreset') {
      cursor = replaceImageArray(data, 'images', assets, cursor, fallbackAlt);
    } else if (block.type === 'circleDetail' && Array.isArray(data.items)) {
      data.items = data.items.map((item) => {
        const asset = assets[cursor];
        if (!asset) return item;
        cursor += 1;
        return {
          ...item,
          image: asset.publicUrl,
          alt: asset.altText || fallbackAlt,
          assetId: asset.id,
        };
      });
    } else if (block.type === 'photoSequence' && Array.isArray(data.items)) {
      data.items = data.items.map((row) => {
        if (!Array.isArray(row?.images)) return row;
        const images = [];
        for (let index = 0; index < row.images.length; index += 1) {
          const asset = assets[cursor + index];
          if (!asset) break;
          images.push(imageValue(asset, fallbackAlt));
        }
        cursor += images.length;
        return images.length ? { ...row, images } : row;
      });
    }

    return { ...block, data };
  });
}

function buildAssetHashMap(assets) {
  const map = new Map();
  for (const asset of assets) {
    const hashes = [
      hashFrom(asset.originalFilename),
      hashFrom(asset.storagePath),
      hashFrom(asset.publicUrl),
    ].filter(Boolean);

    for (const hash of hashes) {
      if (!map.has(hash)) map.set(hash, asset);
    }
  }
  return map;
}

function uniqueAssets(assets) {
  const seen = new Set();
  return assets.filter((asset) => {
    if (!asset || seen.has(asset.id)) return false;
    seen.add(asset.id);
    return true;
  });
}

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const downloadCovers = args.has('--download-covers');
const covers = parseListingCovers();
const photoOrders = parseProjectPhotoOrder();

const projects = await prisma.project.findMany({
  where: { deletedAt: null },
  include: {
    category: true,
    assets: {
      where: { kind: 'image', status: 'active' },
      orderBy: [{ sortOrder: 'asc' }, { originalFilename: 'asc' }],
    },
  },
});

let updated = 0;
let coverUpdates = 0;
let orderUpdates = 0;
const misses = [];

for (const project of projects) {
  const slug = normalizeSlug(project.slug);
  const legacyOrder = photoOrders.get(slug);
  const legacyCover = covers.get(slug);

  if (!legacyOrder && !legacyCover) continue;

  const hashMap = buildAssetHashMap(project.assets);
  const orderedFromLegacy = legacyOrder
    ? uniqueAssets(legacyOrder.photos.map((item) => hashMap.get(item.hash)).filter(Boolean))
    : [];
  const remaining = project.assets.filter((asset) => !orderedFromLegacy.some((item) => item.id === asset.id));
  const orderedAssets = uniqueAssets([...orderedFromLegacy, ...remaining]);
  let coverAsset = legacyCover ? hashMap.get(legacyCover.hash) : null;

  if (legacyOrder && !orderedFromLegacy.length) {
    misses.push({ slug: project.slug, reason: 'photo-order-not-matched', legacyPhotos: legacyOrder.photos.length });
  }
  if (legacyCover && !coverAsset && downloadCovers && !dryRun) {
    try {
      coverAsset = await downloadCoverAsset(project, legacyCover);
      project.assets.push(coverAsset);
    } catch (error) {
      misses.push({ slug: project.slug, reason: 'cover-download-failed', coverFile: legacyCover.file, error: error.message });
    }
  }

  if (legacyCover && !coverAsset) {
    misses.push({ slug: project.slug, reason: 'cover-not-matched', coverFile: legacyCover.file });
  }

  let blocks = [];
  try {
    blocks = JSON.parse(project.content || '[]');
  } catch {
    blocks = [];
  }

  const nextBlocks = orderedFromLegacy.length ? retargetBlocks(project, blocks, orderedAssets) : blocks;
  const nextCover = coverAsset?.publicUrl || project.coverImage;
  const contentChanged = JSON.stringify(nextBlocks) !== JSON.stringify(blocks);
  const coverChanged = nextCover !== project.coverImage;
  const assetOrderChanged = orderedAssets.some((asset, index) => asset.sortOrder !== index);

  if (!contentChanged && !coverChanged && !assetOrderChanged) continue;

  if (dryRun) {
    console.log(`[dry-run] ${project.slug}: legacy=${orderedFromLegacy.length}/${legacyOrder?.photos.length || 0}, cover=${coverAsset ? coverAsset.originalFilename : 'unchanged'}`);
    continue;
  }

  for (const [index, asset] of orderedAssets.entries()) {
    if (asset.sortOrder !== index) {
      await prisma.projectAsset.update({ where: { id: asset.id }, data: { sortOrder: index, updatedAt: new Date().toISOString() } });
    }
  }

  await prisma.project.update({
    where: { id: project.id },
    data: {
      coverImage: nextCover,
      content: contentChanged ? JSON.stringify(nextBlocks) : project.content,
      updatedAt: new Date().toISOString(),
    },
  });

  if (contentChanged) {
    const usages = collectProjectAssetUsages(project, nextBlocks, orderedAssets);
    await prisma.projectAssetUsage.deleteMany({ where: { projectId: project.id } });
    if (usages.length) await prisma.projectAssetUsage.createMany({ data: usages });
    orderUpdates += 1;
  }
  if (coverChanged) coverUpdates += 1;
  updated += 1;
  console.log(`[updated] ${project.slug}: legacy=${orderedFromLegacy.length}/${legacyOrder?.photos.length || 0}, cover=${coverAsset ? coverAsset.originalFilename : 'unchanged'}`);
}

console.log(JSON.stringify({
  dryRun,
  projects: projects.length,
  updated,
  orderUpdates,
  coverUpdates,
  misses: misses.slice(0, 80),
  missCount: misses.length,
}, null, 2));

await prisma.$disconnect();
