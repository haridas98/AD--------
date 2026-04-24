import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

const DEFAULT_ROOT = 'scripts/site-image-archive/alexandradiz.com';
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

function parseArgs(argv) {
  const args = {
    root: DEFAULT_ROOT,
    threshold: 8,
    output: '',
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--threshold') {
      args.threshold = Number(argv[index + 1] || args.threshold);
      index += 1;
      continue;
    }
    if (value === '--output') {
      args.output = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (!value.startsWith('--')) args.root = value;
  }

  return args;
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function isImageFile(filePath) {
  return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

async function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, files);
    } else if (entry.isFile() && isImageFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function resolveScanRoot(root) {
  const absolute = path.resolve(root);
  const pageArchiveRoot = path.join(absolute, '_');
  return fs.existsSync(pageArchiveRoot) ? pageArchiveRoot : absolute;
}

async function averageHash(filePath) {
  const { data } = await sharp(filePath, { animated: false })
    .rotate()
    .resize(16, 16, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const values = Array.from(data);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  let bits = '';

  for (const value of values) bits += value >= average ? '1' : '0';

  return bits;
}

function hammingDistance(left, right) {
  let distance = 0;
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) distance += 1;
  }
  return distance + Math.abs(left.length - right.length);
}

function groupBy(items, key) {
  const map = new Map();
  for (const item of items) {
    const value = item[key];
    if (!value) continue;
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(item);
  }
  return [...map.values()].filter((group) => group.length > 1);
}

function toRelative(root, filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/');
}

function compactGroup(group, root) {
  return {
    count: group.length,
    files: group.map((item) => toRelative(root, item.filePath)),
  };
}

function findSimilarGroups(items, threshold) {
  const groups = [];
  const used = new Set();

  for (let leftIndex = 0; leftIndex < items.length; leftIndex += 1) {
    if (used.has(leftIndex)) continue;

    const group = [items[leftIndex]];
    for (let rightIndex = leftIndex + 1; rightIndex < items.length; rightIndex += 1) {
      if (used.has(rightIndex)) continue;

      const distance = hammingDistance(items[leftIndex].visualHash, items[rightIndex].visualHash);
      if (distance <= threshold) {
        group.push({ ...items[rightIndex], distance });
        used.add(rightIndex);
      }
    }

    if (group.length > 1) {
      used.add(leftIndex);
      groups.push(group);
    }
  }

  return groups;
}

async function main() {
  const args = parseArgs(process.argv);
  const root = path.resolve(args.root);
  const scanRoot = resolveScanRoot(root);
  const output = path.resolve(args.output || path.join(root, 'duplicate-report.json'));
  const files = await walk(scanRoot);
  const records = [];
  const failed = [];

  for (const filePath of files) {
    try {
      const buffer = await fs.promises.readFile(filePath);
      const metadata = await sharp(buffer, { animated: false }).metadata();
      records.push({
        filePath,
        size: buffer.length,
        width: metadata.width || null,
        height: metadata.height || null,
        exactHash: sha256(buffer),
        visualHash: await averageHash(filePath),
      });
    } catch (error) {
      failed.push({
        file: toRelative(root, filePath),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const exactGroups = groupBy(records, 'exactHash');
  const exactDuplicatePaths = new Set(exactGroups.flatMap((group) => group.slice(1).map((item) => item.filePath)));
  const visualCandidates = records.filter((record) => !exactDuplicatePaths.has(record.filePath));
  const similarGroups = findSimilarGroups(visualCandidates, Number.isFinite(args.threshold) ? args.threshold : 8);

  const report = {
    root: toRelative(process.cwd(), root),
    scanRoot: toRelative(process.cwd(), scanRoot),
    generatedAt: new Date().toISOString(),
    threshold: args.threshold,
    totalImages: records.length,
    failedImages: failed.length,
    exactDuplicateGroups: exactGroups.length,
    exactDuplicateFiles: exactGroups.reduce((sum, group) => sum + group.length - 1, 0),
    visuallySimilarGroups: similarGroups.length,
    visuallySimilarFiles: similarGroups.reduce((sum, group) => sum + group.length - 1, 0),
    exactDuplicates: exactGroups.map((group) => ({
      hash: group[0].exactHash,
      ...compactGroup(group, root),
    })),
    visuallySimilar: similarGroups.map((group) => ({
      count: group.length,
      base: toRelative(root, group[0].filePath),
      files: group.map((item) => ({
        file: toRelative(root, item.filePath),
        distance: item.distance || 0,
        width: item.width,
        height: item.height,
      })),
    })),
    failed,
  };

  await fs.promises.writeFile(output, JSON.stringify(report, null, 2), 'utf8');

  console.log(`Images scanned: ${report.totalImages}`);
  console.log(`Exact duplicate groups: ${report.exactDuplicateGroups}`);
  console.log(`Exact duplicate files: ${report.exactDuplicateFiles}`);
  console.log(`Visually similar groups: ${report.visuallySimilarGroups}`);
  console.log(`Visually similar files: ${report.visuallySimilarFiles}`);
  console.log(`Report: ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
