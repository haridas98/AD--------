import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import sharp from 'sharp';

const app = express();
const PORT = process.env.PORT || 8787;
const DATA_PATH = path.resolve('server/data/content.json');
const UPLOADS_DIR = path.resolve('public/uploads');
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

const sessions = new Map();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

function readData() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function normalizeSlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function publicProject(project) {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    categoryId: project.categoryId,
    location: project.location,
    year: project.year,
    coverImage: project.coverImage,
    gallery: project.gallery,
    summary: project.summary,
    workDone: project.workDone,
    featuredOnHome: !!project.featuredOnHome,
    published: !!project.published
  };
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return '';
  return header.slice('Bearer '.length).trim();
}

function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const session = sessions.get(token);
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }

  session.expiresAt = Date.now() + TOKEN_TTL_MS;
  sessions.set(token, session);
  req.adminUser = session.user;
  next();
}

function buildFileUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

app.get('/api/content', (_req, res) => {
  const data = readData();
  const projects = data.projects.filter((p) => p.published !== false).map(publicProject);
  res.json({ ...data, projects });
});

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');

  if (username !== ADMIN_USER || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = createToken();
  sessions.set(token, {
    user: username,
    createdAt: Date.now(),
    expiresAt: Date.now() + TOKEN_TTL_MS
  });

  res.json({ token, user: username });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = getToken(req);
  sessions.delete(token);
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.adminUser });
});

app.get('/api/admin/content', requireAuth, (_req, res) => {
  const data = readData();
  res.json(data);
});

app.post('/api/admin/upload-image', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'image file is required' });

  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.jpg`;
  const output = path.join(UPLOADS_DIR, filename);

  await sharp(req.file.buffer)
    .rotate()
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(output);

  res.json({ url: buildFileUrl(req, filename), filename });
});

app.post('/api/admin/projects', requireAuth, (req, res) => {
  const data = readData();
  const body = req.body || {};

  const title = String(body.title || '').trim();
  const categoryId = String(body.categoryId || '').trim();
  if (!title || !categoryId) {
    return res.status(400).json({ error: 'title and categoryId are required' });
  }

  const nextId = String(Math.max(0, ...data.projects.map((p) => Number(p.id) || 0)) + 1);
  let slug = normalizeSlug(body.slug || title);
  const used = new Set(data.projects.map((p) => p.slug));
  let i = 2;
  while (used.has(slug)) {
    slug = `${normalizeSlug(body.slug || title)}-${i++}`;
  }

  const project = {
    id: nextId,
    title,
    slug,
    categoryId,
    location: String(body.location || ''),
    year: String(body.year || ''),
    coverImage: String(body.coverImage || ''),
    gallery: Array.isArray(body.gallery) ? body.gallery.filter(Boolean) : [],
    summary: String(body.summary || ''),
    workDone: String(body.workDone || ''),
    featuredOnHome: !!body.featuredOnHome,
    published: body.published !== false
  };

  data.projects.unshift(project);
  writeData(data);
  return res.status(201).json(project);
});

app.put('/api/admin/projects/:id', requireAuth, (req, res) => {
  const data = readData();
  const idx = data.projects.findIndex((p) => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'project not found' });

  const existing = data.projects[idx];
  const body = req.body || {};

  const title = String(body.title ?? existing.title).trim();
  const slugCandidate = normalizeSlug(body.slug ?? existing.slug ?? title);
  const slugClash = data.projects.some((p, i) => i !== idx && p.slug === slugCandidate);
  if (slugClash) return res.status(409).json({ error: 'slug already exists' });

  data.projects[idx] = {
    ...existing,
    title,
    slug: slugCandidate,
    categoryId: String(body.categoryId ?? existing.categoryId),
    location: String(body.location ?? existing.location ?? ''),
    year: String(body.year ?? existing.year ?? ''),
    coverImage: String(body.coverImage ?? existing.coverImage ?? ''),
    gallery: Array.isArray(body.gallery) ? body.gallery.filter(Boolean) : existing.gallery || [],
    summary: String(body.summary ?? existing.summary ?? ''),
    workDone: String(body.workDone ?? existing.workDone ?? ''),
    featuredOnHome: body.featuredOnHome ?? existing.featuredOnHome,
    published: body.published ?? existing.published
  };

  writeData(data);
  res.json(data.projects[idx]);
});

app.delete('/api/admin/projects/:id', requireAuth, (req, res) => {
  const data = readData();
  const idx = data.projects.findIndex((p) => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'project not found' });
  const removed = data.projects.splice(idx, 1)[0];
  writeData(data);
  res.json({ ok: true, removedId: removed.id });
});

app.put('/api/admin/home-featured', requireAuth, (req, res) => {
  const data = readData();
  const selected = new Set(Array.isArray(req.body?.projectIds) ? req.body.projectIds.map(String) : []);
  data.projects = data.projects.map((p) => ({ ...p, featuredOnHome: selected.has(String(p.id)) }));
  writeData(data);
  res.json({ ok: true });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
