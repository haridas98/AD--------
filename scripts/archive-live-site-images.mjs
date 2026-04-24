import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const BASE_URL = new URL(process.argv[2] || process.env.SITE_ARCHIVE_BASE_URL || 'https://alexandradiz.com/');
const OUTPUT_ROOT = path.resolve(process.argv[3] || 'scripts/site-image-archive', sanitizeSegment(BASE_URL.hostname));
const PAGE_LIMIT = Number(process.env.SITE_ARCHIVE_PAGE_LIMIT || 0);
const IMAGE_LIMIT_PER_PAGE = Number(process.env.SITE_ARCHIVE_IMAGE_LIMIT_PER_PAGE || 0);
const REQUEST_DELAY_MS = Number(process.env.SITE_ARCHIVE_REQUEST_DELAY_MS || 120);

const HTML_EXTENSIONS = new Set(['', '.html', '.htm', '/']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif', '.svg', '.tif', '.tiff']);
const VIGBO_SIZE_PREFIXES = ['2000-', '1600-', '1200-', '1000-', '800-'];
const ASSET_EXTENSIONS = new Set([
  '.css',
  '.js',
  '.mjs',
  '.json',
  '.xml',
  '.txt',
  '.pdf',
  '.zip',
  '.rar',
  '.mp4',
  '.mov',
  '.webm',
  '.mp3',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
]);

const visitedPages = new Set();
const queuedPages = new Set();
const queuedOrder = [];
const pageResults = [];
const imageCache = new Map();

fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
fs.mkdirSync(path.join(OUTPUT_ROOT, '_cache'), { recursive: true });
fs.mkdirSync(path.join(OUTPUT_ROOT, '_by-source'), { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sha1(input) {
  return crypto.createHash('sha1').update(input).digest('hex');
}

function sanitizeSegment(value) {
  return String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+$/, '_')
    || '_';
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normalizeUrl(raw, currentPageUrl) {
  if (!raw) return '';
  const value = decodeHtml(String(raw).trim());
  if (!value || value.startsWith('#') || value.startsWith('javascript:') || value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('data:') || value.startsWith('blob:')) {
    return '';
  }

  try {
    const url = new URL(value, currentPageUrl);
    if (!/^https?:$/i.test(url.protocol)) return '';
    url.hash = '';
    return url.toString();
  } catch {
    return '';
  }
}

function getPathExtension(url) {
  const parsed = new URL(url);
  return path.extname(parsed.pathname).toLowerCase();
}

function isStaticImageHost(url) {
  const parsed = new URL(url);
  return /(?:^|\.)alexandradiz\.com$|static-cdn|vigbo/i.test(parsed.hostname);
}

function isSameSitePage(url) {
  const parsed = new URL(url);
  if (parsed.hostname !== BASE_URL.hostname) return false;

  const ext = getPathExtension(url);
  if (IMAGE_EXTENSIONS.has(ext) || ASSET_EXTENSIONS.has(ext)) return false;
  if (!HTML_EXTENSIONS.has(ext) && ext) return false;

  parsed.search = '';
  parsed.hash = '';
  return true;
}

function isImageUrl(url) {
  const parsed = new URL(url);
  const ext = getPathExtension(url);

  if (IMAGE_EXTENSIONS.has(ext)) return true;
  if (!isStaticImageHost(url)) return false;

  const pathValue = parsed.pathname.toLowerCase();
  if (/\/blog\/|\/preview\/|\/portfolio\/|\/u\d+\/|\/cache\//i.test(pathValue)) return true;
  if (parsed.searchParams.has('format') || parsed.searchParams.has('filename')) return true;

  return false;
}

function isDecorativeAssetUrl(url) {
  const parsed = new URL(url);
  const pathname = parsed.pathname.toLowerCase();
  return /\/favicon\.ico$|\/logo\/|\/apple-touch-icon|\/site-icons?\//i.test(pathname);
}

function addImageCandidate(images, rawUrl, currentPageUrl) {
  const next = normalizeUrl(rawUrl, currentPageUrl);
  if (next && isImageUrl(next) && !isDecorativeAssetUrl(next)) images.add(next);
}

function addVigboImageVariants(images, rawUrl, currentPageUrl) {
  const normalized = normalizeUrl(rawUrl, currentPageUrl);
  if (!normalized || !isImageUrl(normalized) || isDecorativeAssetUrl(normalized)) return;

  const parsed = new URL(normalized);
  const fileName = path.basename(parsed.pathname);
  const dirName = parsed.pathname.slice(0, Math.max(0, parsed.pathname.length - fileName.length));
  const hasSizePrefix = /^\d+-/.test(fileName);
  const ext = path.extname(fileName).toLowerCase();

  if (/static-cdn|vigbo/i.test(parsed.hostname) && IMAGE_EXTENSIONS.has(ext) && !hasSizePrefix) {
    for (const prefix of VIGBO_SIZE_PREFIXES) {
      const variant = new URL(normalized);
      variant.pathname = `${dirName}${prefix}${fileName}`;
      addImageCandidate(images, variant.toString(), currentPageUrl);
    }
  }

  addImageCandidate(images, normalized, currentPageUrl);
}

function addPage(url) {
  const normalized = normalizeUrl(url, BASE_URL);
  if (!normalized || !isSameSitePage(normalized) || visitedPages.has(normalized) || queuedPages.has(normalized)) return;
  queuedPages.add(normalized);
  queuedOrder.push(normalized);
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; CodexSiteArchiver/1.0)',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return {
    text: await response.text(),
    contentType: response.headers.get('content-type') || '',
    finalUrl: response.url,
  };
}

function collectSitemapUrls(xml) {
  const urls = [];
  const locRegex = /<loc>([^<]+)<\/loc>/gi;
  let match;

  while ((match = locRegex.exec(xml)) !== null) {
    const next = normalizeUrl(match[1], BASE_URL);
    if (next) urls.push(next);
  }

  return urls;
}

async function seedFromSitemap() {
  const candidates = [
    new URL('/sitemap.xml', BASE_URL).toString(),
    new URL('/sitemap_index.xml', BASE_URL).toString(),
  ];

  for (const sitemapUrl of candidates) {
    try {
      const { text, contentType } = await fetchText(sitemapUrl);
      if (!/xml/i.test(contentType) && !text.includes('<loc>')) continue;
      for (const url of collectSitemapUrls(text)) {
        addPage(url);
      }
      return;
    } catch {
      // ignore and try next candidate
    }
  }
}

function extractPageLinks(html, currentPageUrl) {
  const links = new Set();
  const hrefRegex = /\shref\s*=\s*["']([^"']+)["']/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    const next = normalizeUrl(match[1], currentPageUrl);
    if (next && isSameSitePage(next)) links.add(next);
  }

  return Array.from(links);
}

function extractImageLinks(html, currentPageUrl) {
  const images = new Set();
  const attrRegex = /(?:src|data-src|data-src2x|data-original|data-image|content|href|poster)\s*=\s*["']([^"']+)["']/gi;
  const srcsetRegex = /\ssrcset\s*=\s*["']([^"']+)["']/gi;
  const cssUrlRegex = /url\(([^)]+)\)/gi;
  const tagRegex = /<[^>]+>/gi;
  let match;

  while ((match = attrRegex.exec(html)) !== null) {
    addVigboImageVariants(images, match[1], currentPageUrl);
  }

  while ((match = srcsetRegex.exec(html)) !== null) {
    const candidates = match[1].split(',').map((item) => item.trim().split(/\s+/)[0]).filter(Boolean);
    for (const candidate of candidates) {
      const next = normalizeUrl(candidate, currentPageUrl);
      if (next) addVigboImageVariants(images, next, currentPageUrl);
    }
  }

  while ((match = cssUrlRegex.exec(html)) !== null) {
    const candidate = match[1].replace(/^['"]|['"]$/g, '').trim();
    addVigboImageVariants(images, candidate, currentPageUrl);
  }

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[0];
    const basePathMatch = tag.match(/data-base-path\s*=\s*["']([^"']+)["']/i);
    const fileNameMatch = tag.match(/data-file-name\s*=\s*["']([^"']+)["']/i);
    if (basePathMatch && fileNameMatch) {
      addVigboImageVariants(images, `${basePathMatch[1]}${fileNameMatch[1]}`, currentPageUrl);
    }
  }

  return Array.from(images);
}

function pageFolderForUrl(url) {
  const parsed = new URL(url);
  const parts = parsed.pathname
    .split('/')
    .map((part) => sanitizeSegment(part))
    .filter(Boolean);

  if (!parts.length) return path.join(OUTPUT_ROOT, '_root');
  return path.join(OUTPUT_ROOT, ...parts);
}

function sourceFolderForUrl(url) {
  const parsed = new URL(url);
  const host = sanitizeSegment(parsed.hostname);
  const parts = parsed.pathname
    .split('/')
    .map((part) => sanitizeSegment(part))
    .filter(Boolean);

  if (!parts.length) {
    return {
      dir: path.join(OUTPUT_ROOT, '_by-source', host, '_root'),
      fileName: `index${getPathExtension(url) || '.bin'}`,
    };
  }

  const fileName = parts.pop();
  return {
    dir: path.join(OUTPUT_ROOT, '_by-source', host, ...parts),
    fileName,
  };
}

function extensionFromContentType(contentType) {
  if (/image\/jpeg/i.test(contentType)) return '.jpg';
  if (/image\/png/i.test(contentType)) return '.png';
  if (/image\/webp/i.test(contentType)) return '.webp';
  if (/image\/gif/i.test(contentType)) return '.gif';
  if (/image\/svg\+xml/i.test(contentType)) return '.svg';
  if (/image\/avif/i.test(contentType)) return '.avif';
  return '.bin';
}

async function downloadImageToCache(url) {
  if (imageCache.has(url)) return imageCache.get(url);

  const promise = (async () => {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; CodexSiteArchiver/1.0)',
        accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = IMAGE_EXTENSIONS.has(getPathExtension(response.url)) ? getPathExtension(response.url) : extensionFromContentType(response.headers.get('content-type') || '');
    const cacheName = `${sha1(url)}${ext}`;
    const cachePath = path.join(OUTPUT_ROOT, '_cache', cacheName);

    if (!fs.existsSync(cachePath)) {
      fs.writeFileSync(cachePath, buffer);
    }

    return {
      url,
      finalUrl: response.url,
      ext,
      cachePath,
    };
  })();

  imageCache.set(url, promise);
  return promise;
}

function buildLocalImageName(imageUrl, index, ext) {
  const parsed = new URL(imageUrl);
  const baseName = sanitizeSegment(path.basename(parsed.pathname, path.extname(parsed.pathname))) || `image-${index}`;
  return `${String(index).padStart(3, '0')}-${baseName}${ext}`;
}

async function archivePage(pageUrl) {
  const { text, contentType, finalUrl } = await fetchText(pageUrl);
  if (!/html/i.test(contentType)) return;

  const links = extractPageLinks(text, finalUrl);
  const images = extractImageLinks(text, finalUrl);

  for (const link of links) addPage(link);

  const pageDir = pageFolderForUrl(finalUrl);
  const imagesDir = path.join(pageDir, 'images');
  fs.mkdirSync(imagesDir, { recursive: true });

  const selectedImages = IMAGE_LIMIT_PER_PAGE > 0 ? images.slice(0, IMAGE_LIMIT_PER_PAGE) : images;
  const savedImages = [];

  for (let index = 0; index < selectedImages.length; index += 1) {
    const imageUrl = selectedImages[index];
    try {
      const downloaded = await downloadImageToCache(imageUrl);
      const sourceTarget = sourceFolderForUrl(downloaded.finalUrl);
      fs.mkdirSync(sourceTarget.dir, { recursive: true });
      const sourcePath = path.join(sourceTarget.dir, sourceTarget.fileName);
      if (!fs.existsSync(sourcePath)) {
        fs.copyFileSync(downloaded.cachePath, sourcePath);
      }

      const localName = buildLocalImageName(downloaded.finalUrl, index + 1, downloaded.ext);
      const localPath = path.join(imagesDir, localName);

      if (!fs.existsSync(localPath)) {
        fs.copyFileSync(downloaded.cachePath, localPath);
      }

      savedImages.push({
        source: imageUrl,
        finalUrl: downloaded.finalUrl,
        file: path.relative(pageDir, localPath).replace(/\\/g, '/'),
        sourceArchiveFile: path.relative(OUTPUT_ROOT, sourcePath).replace(/\\/g, '/'),
      });
    } catch (error) {
      savedImages.push({
        source: imageUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const manifest = {
    pageUrl: finalUrl,
    discoveredLinks: links.length,
    discoveredImages: images.length,
    savedImages,
  };

  fs.writeFileSync(path.join(pageDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  pageResults.push({
    pageUrl: finalUrl,
    folder: path.relative(OUTPUT_ROOT, pageDir).replace(/\\/g, '/'),
    images: savedImages.length,
  });

  console.log(`Saved ${savedImages.length} images from ${finalUrl}`);
}

async function run() {
  console.log(`Base URL: ${BASE_URL.toString()}`);
  console.log(`Output: ${OUTPUT_ROOT}`);

  addPage(BASE_URL.toString());
  await seedFromSitemap();

  while (queuedOrder.length) {
    const next = queuedOrder.shift();
    if (!next || visitedPages.has(next)) continue;
    visitedPages.add(next);

    if (PAGE_LIMIT > 0 && visitedPages.size > PAGE_LIMIT) break;

    try {
      await archivePage(next);
    } catch (error) {
      console.error(`Failed page ${next}: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (REQUEST_DELAY_MS > 0) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  fs.writeFileSync(
    path.join(OUTPUT_ROOT, 'pages.json'),
    JSON.stringify(
      {
        baseUrl: BASE_URL.toString(),
        pageCount: pageResults.length,
        pages: pageResults,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`Done. Archived ${pageResults.length} pages.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
