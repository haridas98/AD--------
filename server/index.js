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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed'));
    }
  },
});

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// ============ Helpers ============

function normalizeSlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
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

// ============ Public API ============

app.get('/api/content', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { showInHeader: true },
      orderBy: { sortOrder: 'asc' },
    });

    const projects = await prisma.project.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });

    // Parse content JSON string
    const parsedProjects = projects.map((p) => ({
      ...p,
      content: JSON.parse(p.content),
    }));

    res.json({ categories, projects: parsedProjects });
  } catch (err) {
    console.error('Error fetching content:', err);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

app.get('/api/categories', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/categories/:slug', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const { category, featured } = req.query;
    const where = { isPublished: true };
    if (category) where.categoryId = category;
    if (featured === 'true') where.isFeatured = true;

    const projects = await prisma.project.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    res.json(projects.map((p) => ({ ...p, content: JSON.parse(p.content) })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.get('/api/projects/:slug', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { slug: req.params.slug },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!project.isPublished) return res.status(404).json({ error: 'Project not found' });

    res.json({ ...project, content: JSON.parse(project.content) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// ============ Auth ============

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
    expiresAt: Date.now() + TOKEN_TTL_MS,
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

// ============ Admin API ============

app.get('/api/admin/content', requireAuth, async (_req, res) => {
  try {
    const [categories, projects] = await Promise.all([
      prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.project.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    res.json({
      categories,
      projects: projects.map((p) => ({ ...p, content: JSON.parse(p.content) })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin content' });
  }
});

// Categories CRUD
app.post('/api/admin/categories', requireAuth, async (req, res) => {
  try {
    const { name, slug, description, showInHeader, sortOrder } = req.body;
    const finalSlug = slug || normalizeSlug(name);

    const category = await prisma.category.create({
      data: {
        name,
        slug: finalSlug,
        description: description || '',
        showInHeader: showInHeader !== false,
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json(category);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.put('/api/admin/categories/:id', requireAuth, async (req, res) => {
  try {
    const { name, slug, description, showInHeader, sortOrder } = req.body;

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(showInHeader !== undefined && { showInHeader }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    res.json(category);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/admin/categories/:id', requireAuth, async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Projects CRUD
app.post('/api/admin/projects', requireAuth, async (req, res) => {
  try {
    const { title, slug, categoryId, content, isFeatured, isPublished, seoTitle, seoDescription, seoKeywords, sortOrder } = req.body;

    if (!title || !categoryId) {
      return res.status(400).json({ error: 'title and categoryId are required' });
    }

    let finalSlug = slug || normalizeSlug(title);
    // Check slug uniqueness, add ID if needed
    let existing = await prisma.project.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    const project = await prisma.project.create({
      data: {
        title,
        slug: finalSlug,
        categoryId,
        content: typeof content === 'string' ? content : JSON.stringify(content || []),
        isFeatured: isFeatured || false,
        isPublished: isPublished !== false,
        sortOrder: sortOrder || 0,
        seoTitle,
        seoDescription,
        seoKeywords,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    res.status(201).json({ ...project, content: JSON.parse(project.content) });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/admin/projects/:id', requireAuth, async (req, res) => {
  try {
    const { title, slug, categoryId, content, isFeatured, isPublished, seoTitle, seoDescription, seoKeywords, sortOrder } = req.body;

    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    const finalSlug = slug || existing.slug;
    // Check slug conflict
    if (finalSlug !== existing.slug) {
      const conflict = await prisma.project.findUnique({ where: { slug: finalSlug } });
      if (conflict) return res.status(409).json({ error: 'Slug already exists' });
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(slug !== undefined && { slug: finalSlug }),
        ...(categoryId && { categoryId }),
        ...(content && { content: typeof content === 'string' ? content : JSON.stringify(content) }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isPublished !== undefined && { isPublished }),
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDescription !== undefined && { seoDescription }),
        ...(seoKeywords !== undefined && { seoKeywords }),
        ...(sortOrder !== undefined && { sortOrder }),
        updatedAt: new Date().toISOString(),
      },
    });

    res.json({ ...project, content: JSON.parse(project.content) });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/admin/projects/:id', requireAuth, async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Image upload with auto-rename
app.post('/api/admin/upload-image', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image file is required' });

  const { projectName, imageIndex } = req.body;
  const ext = path.extname(req.file.originalname).toLowerCase();

  // Auto-rename: project-name-1.jpg
  let filename;
  if (projectName) {
    const slug = normalizeSlug(projectName);
    filename = `${slug}-${imageIndex || Date.now()}${ext}`;
  } else {
    filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  }

  const output = path.join(UPLOADS_DIR, filename);

  try {
    await sharp(req.file.buffer)
      .rotate()
      .toFormat(ext === '.png' ? 'png' : ext === '.webp' ? 'webp' : 'jpeg', {
        quality: ext === '.png' ? undefined : 88,
      })
      .toFile(output);

    res.json({ url: buildFileUrl(req, filename), filename });
  } catch (err) {
    console.error('Image processing error:', err);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
