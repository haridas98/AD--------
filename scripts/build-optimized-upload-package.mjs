import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index > -1 ? process.argv[index + 1] : fallback;
}

function hasArg(name) {
  return process.argv.includes(name);
}

function normalizeRelativePath(value) {
  const relative = String(value || '').trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!relative || !relative.startsWith('projects/') || relative.includes('..')) return '';
  return relative;
}

function formatBytes(value) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

async function imageToFile(source, destination, ext, maxWidth, quality) {
  let pipeline = sharp(source).rotate();
  const metadata = await pipeline.metadata();

  if ((metadata.width || 0) > maxWidth || (metadata.height || 0) > maxWidth) {
    pipeline = pipeline.resize({
      width: maxWidth,
      height: maxWidth,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  if (ext === '.png') {
    pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality });
  } else {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  }

  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  await pipeline.toFile(destination);
}

async function previewToFile(source, destination) {
  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  await sharp(source)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 74 })
    .toFile(destination);
}

const listPath = argValue('--list', '');
const outputRoot = path.resolve(argValue('--out', '.deploy_tmp/optimized-uploads'));
const uploadsRoot = path.resolve(argValue('--uploads-root', 'public/uploads'));
const maxWidth = Number(argValue('--max-width', '2200'));
const quality = Number(argValue('--quality', '84'));
const dryRun = hasArg('--dry-run');

if (!listPath) {
  console.error('Usage: node scripts/build-optimized-upload-package.mjs --list <paths.txt> [--out <dir>]');
  process.exit(1);
}

const paths = fs.readFileSync(listPath, 'utf8')
  .split(/\r?\n/)
  .map(normalizeRelativePath)
  .filter(Boolean);

let sourceBytes = 0;
let outputBytes = 0;
let processed = 0;
const missing = [];
const failed = [];

for (const relativePath of paths) {
  const source = path.join(uploadsRoot, relativePath);
  const destination = path.join(outputRoot, relativePath);

  if (!fs.existsSync(source)) {
    missing.push(relativePath);
    continue;
  }

  const stat = fs.statSync(source);
  sourceBytes += stat.size;
  processed += 1;

  if (dryRun) continue;

  try {
    const ext = path.extname(relativePath).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      await imageToFile(source, destination, ext, maxWidth, quality);
    } else {
      await fs.promises.mkdir(path.dirname(destination), { recursive: true });
      await fs.promises.copyFile(source, destination);
    }

    outputBytes += fs.statSync(destination).size;

    if (relativePath.includes('/images/original/')) {
      const parsed = path.parse(relativePath);
      const previewPath = relativePath
        .replace('/images/original/', '/images/derived/')
        .replace(parsed.base, `${parsed.name}-preview.webp`);
      const previewDestination = path.join(outputRoot, previewPath);
      await previewToFile(source, previewDestination);
      outputBytes += fs.statSync(previewDestination).size;
    }
  } catch (error) {
    failed.push({ path: relativePath, error: error.message });
  }
}

console.log(JSON.stringify({
  dryRun,
  processed,
  missing: missing.length,
  failed: failed.slice(0, 30),
  failedCount: failed.length,
  sourceBytes,
  outputBytes,
  sourceSize: formatBytes(sourceBytes),
  outputSize: formatBytes(outputBytes),
  outputRoot,
}, null, 2));
