import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { normalizeSqliteDatabaseUrl } from './database-url.mjs';
import { saveProjectAssetUpload, ensureProjectAssetDirectories } from './lib/project-assets.js';
import { hydrateProjectAssetsFromContent, importProjectAssetsFromArchive } from './lib/project-asset-migration.js';
import { syncProjectAssetFolder } from './lib/project-asset-sync.js';
import { generateProjectPageDraft, generateTextDraft } from './lib/project-ai-draft.js';
import { generateGeminiBlockText, generateGeminiProjectMetadata } from './lib/gemini-provider.js';
import { assertThemeShape, readThemeSettings, writeThemeSettings } from './theme-settings.js';

function readLocalEnvFile() {
  const envPath = path.resolve('.env');
  if (!fs.existsSync(envPath)) return {};

  const raw = fs.readFileSync(envPath, 'utf8');
  const values = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!key) continue;
    values[key] = value;
  }

  return values;
}

const localEnv = readLocalEnvFile();
const preferLocalEnv = process.env.NODE_ENV !== 'production';

function getEnvValue(key, fallback = '') {
  if (process.env[key] != null && process.env[key] !== '') return process.env[key];
  if (localEnv[key] != null && localEnv[key] !== '') return localEnv[key];
  return fallback;
}

function getGeminiOptions() {
  return {
    apiKey: getEnvValue('GEMINI_API_KEY') || getEnvValue('GOOGLE_AI_API_KEY'),
    model: getEnvValue('GEMINI_MODEL', 'gemini-flash-latest'),
    imageLimit: Number(getEnvValue('GEMINI_IMAGE_LIMIT', 8)) || 8,
  };
}

function getAssetVisualDuplicateThreshold() {
  return Number(getEnvValue('ASSET_VISUAL_DUPLICATE_THRESHOLD', 8)) || 8;
}

const app = express();
const PORT = getEnvValue('PORT', 8787);
const UPLOADS_DIR = path.resolve('public/uploads');
const ADMIN_USER = getEnvValue('ADMIN_USER', 'admin');
const ADMIN_PASSWORD = getEnvValue('ADMIN_PASSWORD', 'admin123');
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

const databaseUrl = getEnvValue('DATABASE_URL', '');
if (databaseUrl) {
  process.env.DATABASE_URL = normalizeSqliteDatabaseUrl(databaseUrl, process.cwd());
}

const prisma = new PrismaClient();
const sessions = new Map();

// When running behind a reverse proxy (nginx, cloud LB), trust X-Forwarded-* headers.
app.set('trust proxy', 1);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, and WebP images are allowed'));
  },
});

const assetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'video/x-m4v',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WebP, MP4, MOV, WEBM, and M4V files are allowed'));
  },
});

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '8mb' }));

app.get('/uploads/projects/:projectSlug/images/derived/:previewFile', async (req, res, next) => {
  try {
    const projectSlug = normalizeSlug(req.params.projectSlug);
    const previewFile = path.basename(req.params.previewFile || '');
    if (!projectSlug || !previewFile.endsWith('-preview.webp')) return next();

    const derivedDir = path.join(UPLOADS_DIR, 'projects', projectSlug, 'images', 'derived');
    const originalDir = path.join(UPLOADS_DIR, 'projects', projectSlug, 'images', 'original');
    const previewPath = path.join(derivedDir, previewFile);

    if (fs.existsSync(previewPath)) return res.sendFile(previewPath);
    if (!fs.existsSync(originalDir)) return next();

    const originalBase = previewFile.replace(/-preview\.webp$/i, '');
    const originalFile = (await fs.promises.readdir(originalDir))
      .find((file) => path.parse(file).name === originalBase);
    if (!originalFile) return next();

    await fs.promises.mkdir(derivedDir, { recursive: true });
    await sharp(path.join(originalDir, originalFile))
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 74 })
      .toFile(previewPath);

    return res.sendFile(previewPath);
  } catch (error) {
    console.error('Failed to generate image preview', error);
    return next();
  }
});

app.use('/uploads', express.static(UPLOADS_DIR));

// ============ Helpers ============

function normalizeSlug(input) {
  return String(input || '').trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function createToken() { return crypto.randomBytes(32).toString('hex'); }

function getToken(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return '';
  return h.slice(7).trim();
}

function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  const s = sessions.get(token);
  if (s.expiresAt < Date.now()) { sessions.delete(token); return res.status(401).json({ error: 'Session expired' }); }
  s.expiresAt = Date.now() + TOKEN_TTL_MS;
  sessions.set(token, s);
  req.adminUser = s.user;
  next();
}

function fileUrl(req, fn) { return `${req.protocol}://${req.get('host')}/uploads/${fn}`; }

function parseContent(content) {
  if (!content) return [];
  if (typeof content === 'string') { try { return JSON.parse(content); } catch { return []; } }
  return content;
}

function runImageUpload(req, res, next) {
  upload.single('image')(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Image is too large. Max 50 MB' });
    }

    return res.status(400).json({ error: error.message || 'Image upload failed' });
  });
}

function runAssetUpload(req, res, next) {
  assetUpload.any()(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Asset is too large. Max 100 MB' });
    }

    if (error) return res.status(400).json({ error: error.message || 'Asset upload failed' });

    const files = Array.isArray(req.files) ? req.files : [];
    req.file = files.find((file) => file.fieldname === 'asset' || file.fieldname === 'image') || files[0];
    return next();
  });
}

function serializeProjectAsset(asset) {
  const usageCount = asset?._count?.usages ?? asset?.usages?.length ?? 0;
  return {
    ...asset,
    usageCount,
  };
}

async function getProjectOr404(projectId, res) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return null;
  }
  return project;
}

// ============ Public API ============

app.get('/api/content', async (_req, res) => {
  try {
    const themeSettings = readThemeSettings();
    const [categories, projects, blogPosts] = await Promise.all([
      prisma.category.findMany({ where: { showInHeader: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.project.findMany({ where: { isPublished: true, deletedAt: null }, orderBy: [{ isFeatured: 'desc' }, { completedAt: 'desc' }, { year: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }] }),
      prisma.blogPost.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' }, take: 10 }),
    ]);
    res.json({ categories, projects: projects.map(p => ({ ...p, content: parseContent(p.content) })), blogPosts, themeSettings });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/projects/:slug', async (req, res) => {
  try {
    const p = await prisma.project.findUnique({ where: { slug: req.params.slug } });
    if (!p || !p.isPublished || p.deletedAt) return res.status(404).json({ error: 'Not found' });
    res.json({ ...p, content: parseContent(p.content) });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/categories/:slug', async (req, res) => {
  try {
    const c = await prisma.category.findUnique({ where: { slug: req.params.slug } });
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Blog public
app.get('/api/blog', async (_req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
    });
    res.json(posts);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/blog/:slug', async (req, res) => {
  try {
    const post = await prisma.blogPost.findUnique({ where: { slug: req.params.slug } });
    if (!post || !post.isPublished) return res.status(404).json({ error: 'Not found' });
    res.json(post);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// ============ Auth ============

app.post('/api/auth/login', (req, res) => {
  const u = String(req.body?.username || '').trim();
  const p = String(req.body?.password || '');
  if (u !== ADMIN_USER || p !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid' });
  const token = createToken();
  sessions.set(token, { user: u, createdAt: Date.now(), expiresAt: Date.now() + TOKEN_TTL_MS });
  res.json({ token, user: u });
});

app.post('/api/auth/logout', requireAuth, (req, res) => { sessions.delete(getToken(req)); res.json({ ok: true }); });
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ ok: true, user: req.adminUser }));

// ============ Admin API ============

app.get('/api/admin/content', requireAuth, async (_req, res) => {
  try {
    const themeSettings = readThemeSettings();
    const [categories, projects, blogPosts] = await Promise.all([
      prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.project.findMany({ orderBy: [{ isFeatured: 'desc' }, { completedAt: 'desc' }, { year: 'desc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }] }),
      prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);
    res.json({ categories, projects: projects.map(p => ({ ...p, content: parseContent(p.content) })), blogPosts, themeSettings });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/admin/theme-settings', requireAuth, async (req, res) => {
  try {
    assertThemeShape(req.body || {});
    const themeSettings = writeThemeSettings(req.body || {});
    res.json({ themeSettings });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Invalid theme settings' });
  }
});

// Admin stats
app.get('/api/admin/stats', requireAuth, async (_req, res) => {
  try {
    const [projectCount, publishedCount, blogCount, categoryCount] = await Promise.all([
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.project.count({ where: { isPublished: true, deletedAt: null } }),
      prisma.blogPost.count(),
      prisma.category.count(),
    ]);
    res.json({ projectCount, publishedCount, blogCount, categoryCount });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Categories CRUD
app.post('/api/admin/categories', requireAuth, async (req, res) => {
  try {
    const c = await prisma.category.create({ data: { name: req.body.name, slug: req.body.slug || normalizeSlug(req.body.name), description: req.body.description || '', showInHeader: req.body.showInHeader ?? true, sortOrder: req.body.sortOrder || 0 } });
    res.status(201).json(c);
  } catch (err) { res.status(500).json({ error: err.code === 'P2002' ? 'Slug exists' : 'Failed' }); }
});
app.put('/api/admin/categories/:id', requireAuth, async (req, res) => {
  try {
    const c = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.code === 'P2025' ? 'Not found' : 'Failed' }); }
});
app.delete('/api/admin/categories/:id', requireAuth, async (req, res) => {
  try { await prisma.category.delete({ where: { id: req.params.id } }); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err.code === 'P2025' ? 'Not found' : 'Failed' }); }
});

// Projects CRUD
app.post('/api/admin/projects', requireAuth, async (req, res) => {
  try {
    const b = req.body;
    if (!b.title || !b.categoryId) return res.status(400).json({ error: 'title & categoryId required' });
    const now = new Date().toISOString();
    let slug = b.slug || normalizeSlug(b.title);
    if (await prisma.project.findUnique({ where: { slug } })) slug = `${slug}-${Date.now()}`;
    const p = await prisma.project.create({ data: { title: b.title, slug, categoryId: b.categoryId, content: typeof b.content === 'string' ? b.content : JSON.stringify(b.content || []), isFeatured: !!b.isFeatured, isPublished: b.isPublished !== false, stylePreset: b.stylePreset || 'default', seoTitle: b.seoTitle, seoDescription: b.seoDescription, seoKeywords: b.seoKeywords, cityName: b.cityName, year: b.year ? Number(b.year) : null, completedAt: b.completedAt || null, createdAt: now, updatedAt: now, deletedAt: null } });
    ensureProjectAssetDirectories(p.slug, UPLOADS_DIR);
    res.status(201).json({ ...p, content: parseContent(p.content) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/admin/projects/:id', requireAuth, async (req, res) => {
  try {
    const b = req.body;
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    let slug = b.slug ?? existing.slug;
    if (slug !== existing.slug && await prisma.project.findUnique({ where: { slug } })) return res.status(409).json({ error: 'Slug exists' });
    const p = await prisma.project.update({ where: { id: req.params.id }, data: { title: b.title, slug, categoryId: b.categoryId, content: b.content ? (typeof b.content === 'string' ? b.content : JSON.stringify(b.content)) : undefined, isFeatured: b.isFeatured, isPublished: b.isPublished, stylePreset: b.stylePreset || 'default', seoTitle: b.seoTitle, seoDescription: b.seoDescription, seoKeywords: b.seoKeywords, cityName: b.cityName, year: b.year ? Number(b.year) : null, completedAt: b.completedAt || null, updatedAt: new Date().toISOString(), deletedAt: b.deletedAt === '' ? null : b.deletedAt } });
    ensureProjectAssetDirectories(p.slug, UPLOADS_DIR);
    res.json({ ...p, content: parseContent(p.content) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/admin/projects/:id', requireAuth, async (req, res) => {
  try { await prisma.project.update({ where: { id: req.params.id }, data: { deletedAt: new Date().toISOString(), isPublished: false, updatedAt: new Date().toISOString() } }); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err.code === 'P2025' ? 'Not found' : 'Failed' }); }
});

app.post('/api/admin/projects/:id/ai/generate-page', requireAuth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        assets: {
          where: {
            kind: 'image',
            status: 'active',
            includeInAi: true,
          },
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    let provider = 'local';
    let metadata = null;
    const gemini = getGeminiOptions();

    if (gemini.apiKey) {
      try {
        metadata = await generateGeminiProjectMetadata({
          ...gemini,
          project,
          assets: project.assets || [],
          instructions: req.body?.instructions || '',
          uploadsRoot: UPLOADS_DIR,
        });
        provider = 'gemini';
      } catch (err) {
        console.warn('Gemini project draft failed, using local fallback:', err.message);
      }
    }

    const draft = generateProjectPageDraft({
      project,
      assets: project.assets || [],
      instructions: req.body?.instructions || '',
      metadata: metadata || {},
    });

    res.json({ draft, provider });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate project draft' });
  }
});

app.post('/api/admin/ai/generate-text', requireAuth, async (req, res) => {
  try {
    const projectId = req.body?.projectId;
    const project = projectId
      ? await prisma.project.findUnique({
          where: { id: projectId },
          include: { category: true },
        })
      : null;

    const request = {
      project: project || req.body?.project || {},
      blockType: req.body?.blockType,
      fieldName: req.body?.fieldName,
      prompt: req.body?.prompt,
      currentValue: req.body?.currentValue,
    };
    let provider = 'local';
    let text = '';
    const gemini = getGeminiOptions();

    if (gemini.apiKey) {
      try {
        text = await generateGeminiBlockText({ ...gemini, ...request });
        provider = 'gemini';
      } catch (err) {
        console.warn('Gemini text draft failed, using local fallback:', err.message);
      }
    }

    if (!text) text = generateTextDraft(request);

    res.json({ text, provider });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate text draft' });
  }
});

app.get('/api/admin/projects/:id/assets', requireAuth, async (req, res) => {
  try {
    const project = await getProjectOr404(req.params.id, res);
    if (!project) return;

    await importProjectAssetsFromArchive({
      prisma,
      project,
      uploadsRoot: UPLOADS_DIR,
      saveProjectAssetUpload,
      visualDuplicateThreshold: getAssetVisualDuplicateThreshold(),
    });

    await hydrateProjectAssetsFromContent({
      prisma,
      project,
      uploadsRoot: UPLOADS_DIR,
      visualDuplicateThreshold: getAssetVisualDuplicateThreshold(),
    });

    const assets = await prisma.projectAsset.findMany({
      where: {
        projectId: project.id,
        status: { not: 'archived' },
      },
      include: {
        _count: { select: { usages: true } },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ projectId: project.id, assets: assets.map(serializeProjectAsset) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load project assets' });
  }
});

app.post('/api/admin/projects/:id/assets/upload', requireAuth, runAssetUpload, async (req, res) => {
  try {
    const project = await getProjectOr404(req.params.id, res);
    if (!project) return;
    if (!req.file) return res.status(400).json({ error: 'Asset file is required' });

    const saved = await saveProjectAssetUpload({
      uploadsRoot: UPLOADS_DIR,
      projectSlug: project.slug,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      buffer: req.file.buffer,
    });

    const duplicate = await prisma.projectAsset.findFirst({
      where: {
        projectId: project.id,
        checksum: saved.checksum,
      },
    });

    if (duplicate) {
      if (fs.existsSync(saved.absolutePath)) fs.unlinkSync(saved.absolutePath);
      return res.json({ asset: serializeProjectAsset(duplicate), deduplicated: true });
    }

    const asset = await prisma.projectAsset.create({
      data: {
        projectId: project.id,
        kind: saved.kind,
        storagePath: saved.storagePath,
        publicUrl: saved.publicUrl,
        originalFilename: saved.originalFilename,
        mimeType: saved.mimeType,
        width: saved.width,
        height: saved.height,
        fileSize: saved.fileSize,
        checksum: saved.checksum,
        status: 'active',
        sourceType: 'upload',
        sourcePath: saved.absolutePath,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    res.status(201).json({ asset: serializeProjectAsset(asset) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload project asset' });
  }
});

app.post('/api/admin/projects/:id/assets/import-url', requireAuth, async (req, res) => {
  try {
    const project = await getProjectOr404(req.params.id, res);
    if (!project) return;

    const sourceUrl = String(req.body?.url || '').trim();
    if (!sourceUrl) return res.status(400).json({ error: 'URL is required' });

    const response = await fetch(sourceUrl);
    if (!response.ok) return res.status(400).json({ error: 'Failed to download asset' });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const urlFilename = path.basename(new URL(sourceUrl).pathname) || `remote-${Date.now()}`;

    const saved = await saveProjectAssetUpload({
      uploadsRoot: UPLOADS_DIR,
      projectSlug: project.slug,
      originalFilename: urlFilename,
      mimeType: contentType,
      buffer,
    });

    const duplicate = await prisma.projectAsset.findFirst({
      where: {
        projectId: project.id,
        checksum: saved.checksum,
      },
    });

    if (duplicate) {
      if (fs.existsSync(saved.absolutePath)) fs.unlinkSync(saved.absolutePath);
      return res.json({ asset: serializeProjectAsset(duplicate), deduplicated: true });
    }

    const asset = await prisma.projectAsset.create({
      data: {
        projectId: project.id,
        kind: saved.kind,
        storagePath: saved.storagePath,
        publicUrl: saved.publicUrl,
        originalFilename: saved.originalFilename,
        mimeType: saved.mimeType,
        width: saved.width,
        height: saved.height,
        fileSize: saved.fileSize,
        checksum: saved.checksum,
        status: 'active',
        sourceType: 'remote-import',
        sourcePath: sourceUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    res.status(201).json({ asset: serializeProjectAsset(asset) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to import project asset' });
  }
});

app.post('/api/admin/projects/:id/assets/sync', requireAuth, async (req, res) => {
  try {
    const project = await getProjectOr404(req.params.id, res);
    if (!project) return;

    ensureProjectAssetDirectories(project.slug, UPLOADS_DIR);
    const summary = await syncProjectAssetFolder({
      prisma,
      project,
      uploadsRoot: UPLOADS_DIR,
    });

    res.json({ projectId: project.id, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to sync project assets' });
  }
});

app.patch('/api/admin/projects/:projectId/assets/:assetId', requireAuth, async (req, res) => {
  try {
    const project = await getProjectOr404(req.params.projectId, res);
    if (!project) return;

    const existing = await prisma.projectAsset.findFirst({
      where: {
        id: req.params.assetId,
        projectId: project.id,
      },
    });

    if (!existing) return res.status(404).json({ error: 'Asset not found' });

    const asset = await prisma.projectAsset.update({
      where: { id: existing.id },
      data: {
        altText: req.body?.altText ?? existing.altText,
        caption: req.body?.caption ?? existing.caption,
        includeInAi: typeof req.body?.includeInAi === 'boolean' ? req.body.includeInAi : existing.includeInAi,
        sortOrder: Number.isFinite(Number(req.body?.sortOrder)) ? Number(req.body.sortOrder) : existing.sortOrder,
        status: req.body?.status || existing.status,
        updatedAt: new Date().toISOString(),
      },
      include: {
        _count: { select: { usages: true } },
      },
    });

    res.json({ asset: serializeProjectAsset(asset) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update project asset' });
  }
});

app.delete('/api/admin/projects/:projectId/assets/:assetId', requireAuth, async (req, res) => {
  try {
    const project = await getProjectOr404(req.params.projectId, res);
    if (!project) return;

    const asset = await prisma.projectAsset.findFirst({
      where: {
        id: req.params.assetId,
        projectId: project.id,
      },
      include: {
        _count: { select: { usages: true } },
      },
    });

    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    if (asset._count.usages > 0) return res.status(409).json({ error: 'Asset is still used in project blocks' });

    await prisma.projectAsset.update({
      where: { id: asset.id },
      data: {
        status: 'archived',
        updatedAt: new Date().toISOString(),
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete project asset' });
  }
});

// Blog CRUD
app.post('/api/admin/blog', requireAuth, async (req, res) => {
  try {
    const b = req.body;
    let slug = b.slug || normalizeSlug(b.title);
    if (await prisma.blogPost.findUnique({ where: { slug } })) slug = `${slug}-${Date.now()}`;
    const p = await prisma.blogPost.create({ data: { title: b.title, slug, excerpt: b.excerpt || '', content: b.content || '', coverImage: b.coverImage || '', isPublished: !!b.isPublished, seoTitle: b.seoTitle, seoDescription: b.seoDescription, seoKeywords: b.seoKeywords, tags: b.tags || '', publishedAt: b.isPublished ? new Date().toISOString() : null } });
    res.status(201).json(p);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/admin/blog/:id', requireAuth, async (req, res) => {
  try {
    const b = req.body;
    const p = await prisma.blogPost.update({ where: { id: req.params.id }, data: { title: b.title, slug: b.slug, excerpt: b.excerpt, content: b.content, coverImage: b.coverImage, isPublished: b.isPublished, seoTitle: b.seoTitle, seoDescription: b.seoDescription, seoKeywords: b.seoKeywords, tags: b.tags, publishedAt: b.isPublished && !req.body.publishedAt ? new Date().toISOString() : b.publishedAt } });
    res.json(p);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/admin/blog/:id', requireAuth, async (req, res) => {
  try { await prisma.blogPost.delete({ where: { id: req.params.id } }); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Image upload
app.post('/api/admin/upload-image', requireAuth, runImageUpload, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image required' });
  const { projectName, imageIndex } = req.body;
  const ext = path.extname(req.file.originalname).toLowerCase();
  let filename;
  if (projectName) {
    const slug = normalizeSlug(projectName);
    const idx = imageIndex ? `-${imageIndex}` : `-${Date.now()}`;
    filename = `${slug}${idx}${ext}`;
  } else {
    filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  }
  // Remove existing file with same name if exists
  const outPath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  try {
    await sharp(req.file.buffer).rotate().toFormat(ext === '.png' ? 'png' : ext === '.webp' ? 'webp' : 'jpeg', { quality: ext === '.png' ? undefined : 88 }).toFile(outPath);
    res.json({ url: fileUrl(req, filename), filename });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to process image' }); }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ============ Frontend (production) ============

// Serve built frontend files - MUST be after /uploads and after /api routes.
const FRONTEND_DIST = path.resolve('public');
app.use(express.static(FRONTEND_DIST));

// SPA fallback: serve index.html for non-API/non-static routes.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
