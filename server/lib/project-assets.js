import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

const IMAGE_KIND = 'image';
const VIDEO_KIND = 'video';

function normalizeSlugPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeProjectAssetFilename(filename, fallbackStem = 'asset') {
  const parsed = path.parse(String(filename || '').trim());
  const stem = normalizeSlugPart(parsed.name) || fallbackStem;
  const ext = String(parsed.ext || '.jpg').toLowerCase();
  return `${stem}${ext}`;
}

export function getProjectAssetStoragePath(projectSlug, kind, filename) {
  const normalizedSlug = normalizeSlugPart(projectSlug) || 'project';
  const normalizedKind = kind === VIDEO_KIND ? VIDEO_KIND : IMAGE_KIND;
  const section = normalizedKind === VIDEO_KIND ? 'videos' : 'images';
  return path.posix.join('projects', normalizedSlug, section, 'original', filename);
}

export function getProjectAssetPublicUrl(projectSlug, kind, filename) {
  return `/uploads/${getProjectAssetStoragePath(projectSlug, kind, filename)}`;
}

export function getProjectAssetAbsolutePath(projectSlug, kind, filename, uploadsRoot) {
  return path.resolve(uploadsRoot, getProjectAssetStoragePath(projectSlug, kind, filename));
}

export function ensureProjectAssetDirectories(projectSlug, uploadsRoot) {
  const normalizedSlug = normalizeSlugPart(projectSlug) || 'project';
  const projectRoot = path.resolve(uploadsRoot, 'projects', normalizedSlug);
  const imageOriginalDir = path.join(projectRoot, 'images', 'original');
  const imageDerivedDir = path.join(projectRoot, 'images', 'derived');
  const videoOriginalDir = path.join(projectRoot, 'videos', 'original');
  const importsDir = path.join(projectRoot, 'imports');

  for (const dir of [projectRoot, imageOriginalDir, imageDerivedDir, videoOriginalDir, importsDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return {
    projectRoot,
    imageOriginalDir,
    imageDerivedDir,
    videoOriginalDir,
    importsDir,
  };
}

export async function computeFileChecksum(filePath) {
  const buffer = await fs.promises.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function computeBufferChecksum(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function readImageMetadataFromBuffer(buffer) {
  const metadata = await sharp(buffer).metadata();

  return {
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    mimeType: metadata.format ? `image/${metadata.format}` : null,
  };
}

export function isVideoMimeType(mimeType) {
  return String(mimeType || '').startsWith('video/');
}

export function detectAssetKindFromMimeType(mimeType) {
  return isVideoMimeType(mimeType) ? VIDEO_KIND : IMAGE_KIND;
}

export function detectAssetKindFromPath(filePath) {
  const ext = path.extname(String(filePath || '')).toLowerCase();
  return ['.mp4', '.mov', '.webm', '.m4v'].includes(ext) ? VIDEO_KIND : IMAGE_KIND;
}

export async function prepareProjectAssetPayload({
  originalFilename,
  mimeType,
  buffer,
}) {
  const kind = detectAssetKindFromMimeType(mimeType);
  const normalizedFilename = normalizeProjectAssetFilename(originalFilename);
  let outputBuffer = buffer;
  let width = null;
  let height = null;
  let normalizedMimeType = mimeType || null;

  if (kind === IMAGE_KIND) {
    const ext = path.extname(normalizedFilename).toLowerCase();
    const format = ext === '.png' ? 'png' : ext === '.webp' ? 'webp' : 'jpeg';
    outputBuffer = await sharp(buffer)
      .rotate()
      .toFormat(format, { quality: format === 'png' ? undefined : 88 })
      .toBuffer();

    const metadata = await readImageMetadataFromBuffer(outputBuffer);
    width = metadata.width;
    height = metadata.height;
    normalizedMimeType = metadata.mimeType || mimeType || 'image/jpeg';
  }

  return {
    kind,
    normalizedFilename,
    outputBuffer,
    width,
    height,
    mimeType: normalizedMimeType,
    checksum: computeBufferChecksum(outputBuffer),
  };
}

function ensureUniqueFilename(directory, filename) {
  const parsed = path.parse(filename);
  let candidate = filename;
  let counter = 1;

  while (fs.existsSync(path.join(directory, candidate))) {
    candidate = `${parsed.name}-${counter}${parsed.ext}`;
    counter += 1;
  }

  return candidate;
}

export async function saveProjectAssetUpload({
  uploadsRoot,
  projectSlug,
  originalFilename,
  mimeType,
  buffer,
}) {
  const prepared = await prepareProjectAssetPayload({
    originalFilename,
    mimeType,
    buffer,
  });
  const {
    kind,
    normalizedFilename,
    outputBuffer,
    width,
    height,
    mimeType: normalizedMimeType,
    checksum,
  } = prepared;
  const dirs = ensureProjectAssetDirectories(projectSlug, uploadsRoot);
  const targetDirectory = kind === VIDEO_KIND ? dirs.videoOriginalDir : dirs.imageOriginalDir;
  const finalFilename = ensureUniqueFilename(targetDirectory, normalizedFilename);
  const absolutePath = path.join(targetDirectory, finalFilename);
  await fs.promises.writeFile(absolutePath, outputBuffer);

  if (kind === IMAGE_KIND) {
    const previewFilename = `${path.parse(finalFilename).name}-preview.webp`;
    const previewPath = path.join(dirs.imageDerivedDir, previewFilename);
    await sharp(outputBuffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 74 })
      .toFile(previewPath);
  }

  const storagePath = getProjectAssetStoragePath(projectSlug, kind, finalFilename);
  const publicUrl = getProjectAssetPublicUrl(projectSlug, kind, finalFilename);
  const fileStat = await fs.promises.stat(absolutePath);

  return {
    kind,
    storagePath,
    publicUrl,
    absolutePath,
    originalFilename,
    mimeType: normalizedMimeType,
    width,
    height,
    fileSize: Math.round(fileStat.size),
    checksum,
  };
}
