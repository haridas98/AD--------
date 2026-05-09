import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const BASE_URL = process.env.ADMIN_BASE_URL || 'http://127.0.0.1:8787';
const ARCHIVE_ROOT = process.env.LIVE_SITE_ARCHIVE_ROOT || 'E:/AD/_live_site_archive/alexandradiz.com';
const AUDIT_PATH = process.env.LIVE_SITE_AUDIT_PATH || 'E:/AD/_audit/live-site-vs-admin-slugs.json';
const DOWNLOAD_ROOT = process.env.LIVE_SITE_DOWNLOAD_ROOT || 'E:/AD/_live_site_selected';
const USERNAME = process.env.ADMIN_USER || 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const APPLY = process.argv.includes('--apply');
const LIMIT = Number(process.env.LIVE_SITE_IMPORT_LIMIT || 0);
const TARGET_ASSETS = Number(process.env.LIVE_SITE_TARGET_ASSETS || 10);
const ONLY = (process.argv.find((arg) => arg.startsWith('--only=')) || '').slice('--only='.length);

function cleanSizePrefix(value) {
  return String(value || '').replace(/^(?:2000|1600|1200|1000|800)-/i, '');
}

function imageKey(url) {
  const parsed = new URL(url);
  return cleanSizePrefix(path.basename(parsed.pathname)).toLowerCase();
}

function scoreImage(url) {
  const file = path.basename(new URL(url).pathname);
  if (/^1000-/i.test(file)) return 60;
  if (/^1200-/i.test(file)) return 55;
  if (/^800-/i.test(file)) return 50;
  if (/^1600-/i.test(file)) return 40;
  if (/^2000-/i.test(file)) return 30;
  return 35;
}

function selectImageUrls(manifest, count) {
  const bestByKey = new Map();
  for (const item of manifest.savedImages || []) {
    if (!item?.source) continue;
    const key = imageKey(item.source);
    const previous = bestByKey.get(key);
    if (!previous || scoreImage(item.source) > scoreImage(previous)) {
      bestByKey.set(key, item.source);
    }
  }

  return Array.from(bestByKey.values())
    .sort((a, b) => scoreImage(b) - scoreImage(a))
    .slice(0, count);
}

function pageManifestPath(folder) {
  return path.join(ARCHIVE_ROOT, folder, 'manifest.json');
}

function localDownloadPath(adminSlug, url, index) {
  const parsed = new URL(url);
  const ext = path.extname(parsed.pathname) || '.jpg';
  const base = cleanSizePrefix(path.basename(parsed.pathname, ext)).replace(/[^a-z0-9_-]+/gi, '-');
  return path.join(DOWNLOAD_ROOT, adminSlug, `${String(index + 1).padStart(3, '0')}-${base}${ext}`);
}

function download(url, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0) return true;

  try {
    execFileSync('powershell.exe', [
      '-NoProfile',
      '-Command',
      "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri $env:DOWNLOAD_URL -OutFile $env:DOWNLOAD_TARGET -TimeoutSec 60 -UseBasicParsing",
    ], {
      env: {
        ...process.env,
        DOWNLOAD_URL: url,
        DOWNLOAD_TARGET: targetPath,
      },
    });
    return fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0;
  } catch {
    try {
      execFileSync('curl.exe', [
        '-L',
        '--fail',
        '--silent',
        '--show-error',
        '--max-time',
        '30',
        '-A',
        'Mozilla/5.0 (compatible; CodexLiveSiteImporter/1.0)',
        '-o',
        targetPath,
        url,
      ]);
      return fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0;
    } catch {
      if (fs.existsSync(targetPath)) fs.rmSync(targetPath, { force: true });
      return false;
    }
  }
}

async function request(pathname, options = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${options.method || 'GET'} ${pathname} failed ${response.status}: ${text}`);
  }
  return response.json();
}

function buildContent(project, assets) {
  const images = assets.slice(0, TARGET_ASSETS).map((asset, index) => ({
    url: asset.publicUrl,
    alt: asset.altText || `${project.title} photo ${index + 1}`,
    assetId: asset.id,
  }));
  const hero = images[0];

  return [
    {
      id: 'live-site-hero',
      type: 'heroImage',
      data: {
        title: project.title,
        subtitle: project.cityName ? `Completed project in ${project.cityName}.` : 'Completed residential project.',
        image: hero?.url || '',
        alt: hero?.alt || project.title,
      },
    },
    {
      id: 'live-site-grid',
      type: 'imageGrid',
      data: {
        columns: 2,
        images,
      },
    },
    {
      id: 'live-site-slider',
      type: 'refinedSlider',
      data: {
        title: 'Project photos',
        description: 'Selected real photographs from the completed project.',
        thumbnailPosition: 'bottom',
        images,
      },
    },
  ];
}

async function main() {
  const auditRows = JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf8'));
  const archivedPages = JSON.parse(fs.readFileSync(path.join(ARCHIVE_ROOT, 'pages.json'), 'utf8')).pages || [];
  const pageFolders = new Map(archivedPages.map((page) => [
    new URL(page.pageUrl).pathname.replace(/^\/+|\/+$/g, ''),
    page.folder,
  ]));
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const headers = { authorization: `Bearer ${login.token}` };
  const jsonHeaders = { ...headers, 'content-type': 'application/json' };
  const content = await request('/api/admin/content', { headers });
  const bySlug = new Map(content.projects.map((project) => [project.slug, project]));
  const candidates = auditRows
    .filter((row) => row.adminSlug && Number(row.activeAssets) < Math.min(TARGET_ASSETS, Number(row.oldImages || 0)))
    .filter((row) => !ONLY || row.adminSlug === ONLY || row.oldPath === ONLY)
    .slice(0, LIMIT || undefined);

  const results = [];

  for (const row of candidates) {
    const project = bySlug.get(row.adminSlug);
    if (!project) continue;
    const folder = row.folder || pageFolders.get(row.oldPath);
    if (!folder) {
      results.push({ title: project.title, slug: project.slug, before: row.activeAssets, skipped: 'missing archived folder' });
      continue;
    }
    const manifest = JSON.parse(fs.readFileSync(pageManifestPath(folder), 'utf8'));
    const existingResponse = await request(`/api/admin/projects/${project.id}/assets`, { headers });
    const existingAssets = existingResponse.assets || [];
    if (existingAssets.length >= TARGET_ASSETS) {
      results.push({
        title: project.title,
        slug: project.slug,
        before: existingAssets.length,
        target: TARGET_ASSETS,
        skipped: 'already at target',
        mode: APPLY ? 'APPLY' : 'DRY_RUN',
      });
      continue;
    }

    const needed = Math.max(0, TARGET_ASSETS - existingAssets.length);
    const urls = selectImageUrls(manifest, needed + 4);
    const uploadedAssets = [...existingAssets];
    let downloaded = 0;
    let uploaded = 0;

    if (APPLY && needed > 0) {
      for (const url of urls) {
        if (uploaded >= needed) break;
        const filePath = localDownloadPath(row.adminSlug, url, downloaded);
        downloaded += 1;
        if (!download(url, filePath)) continue;

        const buffer = fs.readFileSync(filePath);
        const form = new FormData();
        form.append('asset', new Blob([buffer], { type: 'image/jpeg' }), path.basename(filePath));
        try {
          const response = await request(`/api/admin/projects/${project.id}/assets/upload`, {
            method: 'POST',
            headers,
            body: form,
          });
          if (response.asset) {
            uploadedAssets.push(response.asset);
            uploaded += response.deduplicated ? 0 : 1;
          }
        } catch (error) {
          console.error(`Upload failed for ${project.slug}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      await request(`/api/admin/projects/${project.id}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({
          title: project.title,
          slug: project.slug,
          categoryId: project.categoryId,
          isFeatured: project.isFeatured,
          isPublished: project.isPublished,
          stylePreset: project.stylePreset || 'default',
          sortOrder: project.sortOrder || 0,
          cityName: project.cityName || '',
          year: project.year || '',
          completedAt: project.completedAt || '',
          deletedAt: '',
          seoTitle: project.seoTitle || '',
          seoDescription: project.seoDescription || '',
          seoKeywords: project.seoKeywords || '',
          content: JSON.stringify(buildContent(project, uploadedAssets)),
        }),
      });
    }

    results.push({
      title: project.title,
      slug: project.slug,
      before: existingAssets.length,
      target: TARGET_ASSETS,
      candidateUrls: urls.length,
      downloaded,
      uploaded,
      mode: APPLY ? 'APPLY' : 'DRY_RUN',
    });
    console.log(`${APPLY ? '[imported]' : '[plan]'} ${project.title}: ${existingAssets.length} -> ${Math.min(TARGET_ASSETS, existingAssets.length + uploaded)} (${urls.length} candidate URLs)`);
  }

  fs.mkdirSync('E:/AD/_audit', { recursive: true });
  fs.writeFileSync('E:/AD/_audit/live-site-photo-import-results.json', JSON.stringify(results, null, 2), 'utf8');
  console.log(JSON.stringify({ mode: APPLY ? 'APPLY' : 'DRY_RUN', projects: results.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
