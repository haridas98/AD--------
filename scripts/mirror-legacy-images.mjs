import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

const ROOT = path.resolve('public/legacy');
const OUT_DIR = path.resolve('public/media/legacy');
const OUT_MAP = path.resolve('src/generated/localImageMap.js');
const FAILED_LOG = path.resolve('scripts/image-sync-failed.txt');
const CONCURRENCY = Number(process.env.IMG_SYNC_CONCURRENCY || 4);
const RETRIES = Number(process.env.IMG_SYNC_RETRIES || 4);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(OUT_MAP), { recursive: true });

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function isRelevantHost(host) {
  return /static-cdn|vigbo|alexandradiz\.com/i.test(host);
}

function normalizeImageUrl(raw) {
  if (!raw) return '';
  let v = raw.trim();
  if (!v || v.startsWith('data:') || v.startsWith('blob:') || v.startsWith('javascript:') || v.startsWith('#')) return '';
  if (v.startsWith('//')) v = `https:${v}`;
  try {
    const u = new URL(v);
    if (!isRelevantHost(u.host)) return '';
    const lower = u.pathname.toLowerCase();
    const isImage = /(\.jpg|\.jpeg|\.png|\.webp|\.avif|\.gif|\.bmp|\.tiff)$/i.test(lower) || /\/preview\//i.test(lower) || /\/blog\//i.test(lower) || /\/logo\//i.test(lower);
    if (!isImage) return '';
    return u.toString();
  } catch {
    return '';
  }
}

function collectUrlsFromHtml(html) {
  const out = new Set();
  const attrRegex = /(?:src|data-src|data-src2x|content|href)="([^"]+)"/gi;
  let m;
  while ((m = attrRegex.exec(html)) !== null) {
    const u = normalizeImageUrl(m[1]);
    if (u) out.add(u);
  }

  const cssUrlRegex = /url\(([^)]+)\)/gi;
  while ((m = cssUrlRegex.exec(html)) !== null) {
    const raw = m[1].replace(/['"]/g, '').trim();
    const u = normalizeImageUrl(raw);
    if (u) out.add(u);
  }

  return out;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadBuffer(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function downloadWithRetries(url, retries = RETRIES) {
  let lastErr;
  for (let i = 0; i < retries; i += 1) {
    try {
      return await downloadBuffer(url);
    } catch (err) {
      lastErr = err;
      await sleep(500 * (i + 1));
    }
  }
  throw lastErr;
}

function hashOf(input) {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 20);
}

function writeMap(map) {
  const js = `const localImageMap = ${JSON.stringify(map, null, 2)};\n\nexport default localImageMap;\n`;
  fs.writeFileSync(OUT_MAP, js, 'utf8');
}

function readMap() {
  if (!fs.existsSync(OUT_MAP)) return {};
  try {
    const raw = fs.readFileSync(OUT_MAP, 'utf8');
    const match = raw.match(/const localImageMap = ([\s\S]*);\n\nexport default localImageMap;/);
    if (!match) return {};
    return JSON.parse(match[1]);
  } catch {
    return {};
  }
}

async function processUrl(url, map) {
  const key = hashOf(url);
  const filename = `${key}.jpg`;
  const absOut = path.join(OUT_DIR, filename);
  const webPath = `/media/legacy/${filename}`;

  if (!fs.existsSync(absOut)) {
    const source = await downloadWithRetries(url);
    await sharp(source)
      .rotate()
      .resize({ width: 2200, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(absOut);
  }

  map[url] = webPath;
  try {
    const short = new URL(url);
    short.search = '';
    short.hash = '';
    map[short.toString()] = webPath;
  } catch {}
}

async function runPool(urls, map) {
  let index = 0;
  let completed = 0;
  const failed = [];

  async function worker() {
    while (index < urls.length) {
      const i = index++;
      const url = urls[i];
      try {
        await processUrl(url, map);
      } catch (err) {
        failed.push({ url, error: err.message });
      }
      completed += 1;
      if (completed % 20 === 0 || completed === urls.length) {
        writeMap(map);
        console.log(`Processed ${completed}/${urls.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, CONCURRENCY) }, () => worker()));
  return failed;
}

async function run() {
  const files = walk(ROOT);
  const all = new Set();
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const set = collectUrlsFromHtml(html);
    set.forEach((u) => all.add(u));
  }

  const urls = Array.from(all);
  const map = readMap();

  console.log(`Found ${urls.length} unique remote image URLs`);
  console.log(`Using concurrency=${CONCURRENCY}, retries=${RETRIES}`);

  const failed = await runPool(urls, map);
  writeMap(map);

  if (failed.length) {
    const text = failed.map((f) => `${f.url}\t${f.error}`).join('\n');
    fs.writeFileSync(FAILED_LOG, text, 'utf8');
    console.log(`Saved failed list: ${FAILED_LOG} (${failed.length})`);
  } else if (fs.existsSync(FAILED_LOG)) {
    fs.unlinkSync(FAILED_LOG);
  }

  console.log(`Saved map with ${Object.keys(map).length} keys`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
