import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = process.env.PORT || 8787;
const UPLOADS_DIR = path.resolve('public/uploads');
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

const prisma = new PrismaClient();
const sessions = new Map();

// When running behind a reverse proxy (nginx, cloud LB), trust X-Forwarded-* headers.
app.set('trust proxy', 1);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, and WebP images are allowed'));
  },
});

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '8mb' }));
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

// ============ Public API ============

app.get('/api/content', async (_req, res) => {
  try {
    const [categories, projects, blogPosts] = await Promise.all([
      prisma.category.findMany({ where: { showInHeader: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.project.findMany({ where: { isPublished: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] }),
      prisma.blogPost.findMany({ where: { isPublished: true }, orderBy: { publishedAt: 'desc' }, take: 10 }),
    ]);
    res.json({ categories, projects: projects.map(p => ({ ...p, content: parseContent(p.content) })), blogPosts });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/projects/:slug', async (req, res) => {
  try {
    const p = await prisma.project.findUnique({ where: { slug: req.params.slug } });
    if (!p || !p.isPublished) return res.status(404).json({ error: 'Not found' });
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
    const [categories, projects, blogPosts] = await Promise.all([
      prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.project.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);
    res.json({ categories, projects: projects.map(p => ({ ...p, content: parseContent(p.content) })), blogPosts });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Admin stats
app.get('/api/admin/stats', requireAuth, async (_req, res) => {
  try {
    const [projectCount, publishedCount, blogCount, categoryCount] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { isPublished: true } }),
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
    let slug = b.slug || normalizeSlug(b.title);
    if (await prisma.project.findUnique({ where: { slug } })) slug = `${slug}-${Date.now()}`;
    const p = await prisma.project.create({ data: { title: b.title, slug, categoryId: b.categoryId, content: typeof b.content === 'string' ? b.content : JSON.stringify(b.content || []), isFeatured: !!b.isFeatured, isPublished: b.isPublished !== false, seoTitle: b.seoTitle, seoDescription: b.seoDescription, seoKeywords: b.seoKeywords, cityName: b.cityName, year: b.year ? Number(b.year) : null } });
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
    const p = await prisma.project.update({ where: { id: req.params.id }, data: { title: b.title, slug, categoryId: b.categoryId, content: b.content ? (typeof b.content === 'string' ? b.content : JSON.stringify(b.content)) : undefined, isFeatured: b.isFeatured, isPublished: b.isPublished, seoTitle: b.seoTitle, seoDescription: b.seoDescription, seoKeywords: b.seoKeywords, cityName: b.cityName, year: b.year ? Number(b.year) : null } });
    res.json({ ...p, content: parseContent(p.content) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/admin/projects/:id', requireAuth, async (req, res) => {
  try { await prisma.project.delete({ where: { id: req.params.id } }); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err.code === 'P2025' ? 'Not found' : 'Failed' }); }
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
app.post('/api/admin/upload-image', requireAuth, upload.single('image'), async (req, res) => {
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
