import fs from 'node:fs';
import path from 'node:path';

import { normalizeSqliteDatabaseUrl } from '../database-url.mjs';

function readLocalEnvFile() {
  const envPath = path.resolve('.env');
  if (!fs.existsSync(envPath)) return {};

  const values = {};
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) values[key] = value;
  }
  return values;
}

function getEnvValue(localEnv, key, fallback = '') {
  if (process.env[key] != null && process.env[key] !== '') return process.env[key];
  if (localEnv[key] != null && localEnv[key] !== '') return localEnv[key];
  return fallback;
}

function toSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function timestamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
}

function backupSqliteDatabase(databaseUrl) {
  if (!databaseUrl?.startsWith('file:')) return '';

  const dbPath = path.resolve(databaseUrl.replace(/^file:/, ''));
  if (!fs.existsSync(dbPath)) return '';

  const backupPath = `${dbPath}.before-blog-block-seed-${timestamp()}.bak`;
  fs.copyFileSync(dbPath, backupPath);
  return backupPath;
}

function listProjectImages(projectSlug, limit = 8) {
  const dir = path.resolve('public/uploads/projects', projectSlug, 'images/original');
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .slice(0, limit)
    .map((file) => `/uploads/projects/${projectSlug}/images/original/${file}`);
}

function makeBlocks(article) {
  const images = article.images;
  const cover = article.coverImage || images[0] || '';

  return [
    {
      id: 'blog-hero',
      type: 'heroImage',
      data: {
        title: article.title,
        subtitle: article.excerpt,
        image: cover,
        alt: article.title,
      },
    },
    {
      id: 'blog-editorial-note',
      type: 'editorialNote',
      data: {
        eyebrow: 'Design Journal',
        title: article.sections[0].title,
        note: article.sections[0].text,
        image: images[1] || cover,
        alt: article.title,
      },
    },
    {
      id: 'blog-side-by-side',
      type: 'sideBySide',
      data: {
        title: article.sections[1].title,
        text: article.sections[1].text,
        image: images[2] || cover,
        alt: article.title,
        imagePosition: article.imagePosition || 'right',
      },
    },
    {
      id: 'blog-image-grid',
      type: 'imageGrid',
      data: {
        columns: 2,
        images: images.slice(0, 6).map((url, index) => ({ url, alt: `${article.title} ${index + 1}` })),
      },
    },
    {
      id: 'blog-typography-main',
      type: 'typography',
      data: {
        title: article.sections[2].title,
        content: article.sections[2].text,
        size: 'lg',
      },
    },
    article.sections[3]
      ? {
          id: 'blog-typography-secondary',
          type: 'typography',
          data: {
            title: article.sections[3].title,
            content: article.sections[3].text,
            size: 'md',
          },
        }
      : null,
    {
      id: 'blog-cta',
      type: 'ctaSection',
      data: {
        title: 'Planning your own remodel?',
        text: 'Bring the room, the constraints, and the references. Alexandra Diz Architecture can turn them into a composed design direction.',
        buttonText: 'Contact us',
        buttonLink: '/contact',
      },
    },
  ].filter(Boolean);
}

function article(title, projectSlug, excerpt, tags, sections, imagePosition = 'right') {
  const images = listProjectImages(projectSlug, 8);
  return {
    title,
    slug: toSlug(title),
    projectSlug,
    excerpt,
    tags,
    images,
    coverImage: images[0] || '',
    imagePosition,
    sections,
  };
}

const articles = [
  article(
    '5 Trends in Modern Kitchen Design for 2026',
    'belmond',
    'A focused look at kitchen ideas that feel current without becoming disposable: warm materials, storage discipline, layered light, and quiet contrast.',
    'kitchen,design,trends,2026',
    [
      {
        title: 'Trend is useful only when it solves something',
        text: 'The strongest kitchens are not trend collections. They use current ideas to improve flow, storage, atmosphere, and the way the family actually cooks.',
      },
      {
        title: 'Warmth is replacing sterile contrast',
        text: 'Soft whites, natural wood, honed stone, muted color, and warmer metals are becoming more useful than hard black-and-white contrast.',
      },
      {
        title: 'Storage is becoming quieter',
        text: 'Hidden pantries, integrated appliances, cleaner appliance zones, and fewer exposed objects are making kitchens feel calmer and more architectural.',
      },
    ],
  ),
  article(
    'How to Plan a Bathroom Remodel That Stands the Test of Time',
    'blue-depth-oakland',
    'A practical sequence for planning a bathroom that feels calm now and still makes sense years later.',
    'bathroom,remodel,planning,guide',
    [
      {
        title: 'Start with the daily routine',
        text: 'A timeless bathroom starts with how the room is used: morning pace, storage needs, shower habits, cleaning expectations, and whether the space should feel energizing or restorative.',
      },
      {
        title: 'Choose materials by durability and mood',
        text: 'Tile, stone, vanity finish, and metal should be tested together. The right palette carries moisture, light, and daily use without feeling visually busy.',
      },
      {
        title: 'Lighting makes the room age well',
        text: 'Layered light around mirrors, ceiling zones, and architectural features keeps the bathroom practical while giving the finishes depth.',
      },
    ],
  ),
  article(
    'The Rise of ADUs: Adding Value and Space to California Homes',
    'menlo-park',
    'Why accessory dwelling units are becoming a practical design tool for flexibility, value, and multigenerational living.',
    'ADU,California,real estate,investment',
    [
      {
        title: 'The best ADUs feel complete',
        text: 'A good ADU is not a leftover room. It needs its own rhythm, storage, light, durable finishes, and enough identity to feel like a small home.',
      },
      {
        title: 'Flexibility drives value',
        text: 'Guest suite, rental, office, studio, or family support: the plan should be simple enough to shift over time without major reconstruction.',
      },
      {
        title: 'Small scale needs discipline',
        text: 'Compact square footage rewards fewer materials, smarter built-ins, and clear sightlines. Every decision has to work harder.',
      },
    ],
  ),
  article(
    'Creating a Timeless Fireplace: Design Ideas That Never Go Out of Style',
    'classical-melody-palo-alto',
    'How proportion, material restraint, and texture keep a fireplace from becoming a dated focal point.',
    'fireplace,design,interior,home',
    [
      {
        title: 'The fireplace should anchor, not shout',
        text: 'A timeless fireplace gives the room weight. It does not need too many decorative moves if the surround, hearth, and adjacent wall are proportioned well.',
      },
      {
        title: 'Material restraint lasts longer',
        text: 'Stone, plaster, brick, or metal should support the architecture. One confident material often ages better than a busy mix.',
      },
      {
        title: 'Built-ins need breathing room',
        text: 'Shelving, art, and mantel details should frame the fire without crowding it. Negative space is part of the composition.',
      },
    ],
  ),
  article(
    'How to Choose Marble for a Kitchen or Bathroom Remodel',
    'belmond-2441-coronet',
    'A practical guide to choosing marble by mood, maintenance, veining, scale, and how the stone will read in real light.',
    'marble,materials,kitchen,bathroom,remodel',
    [
      {
        title: 'Start with the room, not the slab',
        text: 'Marble should not be selected as a standalone object. The right choice depends on cabinet tone, daylight, faucet finish, grout color, and how much visual movement the room can hold.',
      },
      {
        title: 'Veining needs proportion',
        text: 'A dramatic slab can make a kitchen feel intentional, but only when the island, backsplash, and vertical surfaces have enough breathing room. Smaller bathrooms often need calmer veining or a single controlled focal wall.',
      },
      {
        title: 'Maintenance is part of the aesthetic',
        text: 'Natural marble patinas. That is beautiful when the client wants softness and history, but it is the wrong promise if the expectation is a perfect showroom surface forever.',
      },
      {
        title: 'Where porcelain makes sense',
        text: 'Porcelain can be the better technical choice for shower walls, rental units, or high-maintenance households. The strongest projects are honest about where natural stone matters and where performance should lead.',
      },
    ],
  ),
  article(
    'Natural Stone vs Porcelain: What to Use Where',
    'bathroom-in-victorian-style-palo-alto',
    'A designer-facing breakdown of where natural stone creates value and where porcelain quietly solves the real problem.',
    'stone,porcelain,bathroom,materials',
    [
      {
        title: 'Use stone where touch matters',
        text: 'Natural stone is strongest on surfaces people notice up close: vanity tops, feature walls, fireplace surrounds, and moments where texture can carry the room.',
      },
      {
        title: 'Use porcelain where water wins',
        text: 'Porcelain is often the sharper choice inside showers and wet zones because it resists staining, reduces maintenance anxiety, and still gives a clean architectural plane.',
      },
      {
        title: 'The best rooms mix both',
        text: 'A sophisticated interior does not need one material everywhere. It needs hierarchy: one expressive surface, several quiet supporting surfaces, and details that make the transition feel intentional.',
      },
    ],
  ),
  article(
    'Lighting Layers That Make a Remodel Feel Finished',
    'bright-mood-pacifica',
    'Why ambient, task, accent, and decorative lighting should be planned before finishes are finalized.',
    'lighting,kitchen,remodel,interior design',
    [
      {
        title: 'Lighting is structure',
        text: 'Lighting is not decoration added at the end. It determines how material color reads, how deep a room feels, and whether the most expensive finishes actually look resolved.',
      },
      {
        title: 'Every zone needs a job',
        text: 'Task lighting belongs where people cook, read, apply makeup, or move through cabinetry. Ambient lighting sets comfort. Accent lighting gives architecture a quiet rhythm.',
      },
      {
        title: 'Decorative fixtures need restraint',
        text: 'Pendants and sconces should not compete with every other line in the room. They work best when they anchor a view, repeat a finish, or soften a hard architectural edge.',
      },
    ],
  ),
  article(
    'Kitchen Storage Before Cabinet Design',
    'emerald-sky',
    'The best cabinet elevations start with inventory, habits, appliance rhythm, and what should stay hidden.',
    'kitchen,cabinets,storage,planning',
    [
      {
        title: 'Storage is personal',
        text: 'Two kitchens with the same footprint can need completely different storage. Cooking style, hosting habits, small appliances, pantry expectations, and cleanup rhythm all change the plan.',
      },
      {
        title: 'Plan the invisible first',
        text: 'Trash, trays, cleaning supplies, oils, coffee, charging, and pet items are the details that decide whether a kitchen feels calm after move-in.',
      },
      {
        title: 'Cabinet beauty follows function',
        text: 'Once storage logic is clear, door proportions, open shelves, appliance panels, and stone edges can be composed without forcing the room to perform badly.',
      },
    ],
  ),
  article(
    'Bathroom Remodel Planning Sequence',
    'blue-depth-oakland',
    'A clear order of decisions for bathrooms: layout, plumbing, tile, lighting, storage, and final atmosphere.',
    'bathroom,planning,remodel,tile',
    [
      {
        title: 'Layout comes first',
        text: 'Before tile or fixtures, the plan needs to resolve clearances, door swings, shower dimensions, plumbing constraints, and where the eye lands when the room opens.',
      },
      {
        title: 'Tile should support scale',
        text: 'Large format tile can calm a small room, while smaller tile can bring craft and rhythm. The right answer depends on proportion, not trend.',
      },
      {
        title: 'Storage prevents visual noise',
        text: 'A bathroom feels premium when everyday objects have a place. Niches, drawers, medicine cabinets, and linen storage are part of the design, not afterthoughts.',
      },
    ],
  ),
  article(
    'Warm Minimalism: Why Soft Neutrals Still Work',
    'beige-tenderness',
    'How warm whites, pale woods, stone, and quiet contrast create calm without becoming flat.',
    'warm minimalism,neutral interiors,materials',
    [
      {
        title: 'Neutral does not mean empty',
        text: 'A warm neutral interior needs texture, depth, and disciplined contrast. Without those layers, it becomes flat; with them, it feels composed and expensive.',
      },
      {
        title: 'Texture carries the palette',
        text: 'Wood grain, honed stone, fabric, plaster, and brushed metal let a restrained palette feel tactile instead of plain.',
      },
      {
        title: 'Restraint needs one anchor',
        text: 'A darker vanity, a stronger stone vein, or a sculptural fixture gives the room a focal point while preserving quietness around it.',
      },
    ],
  ),
  article(
    'ADU Design for a Small Footprint',
    'menlo-park',
    'How to make compact accessory dwellings feel complete, flexible, and properly designed.',
    'ADU,small space,California,design',
    [
      {
        title: 'Small rooms need fewer ideas',
        text: 'An ADU becomes stronger when the palette is focused, storage is integrated, and every view has a clear job.',
      },
      {
        title: 'Flexibility adds value',
        text: 'A compact unit might need to work as guest suite, office, rental, or multigenerational space. Built-ins, lighting scenes, and durable finishes help the plan adapt.',
      },
      {
        title: 'Exterior and interior should agree',
        text: 'The best ADUs do not feel like detached afterthoughts. They share material logic with the main home while keeping enough identity to feel complete.',
      },
    ],
  ),
  article(
    'Fireplace Materials That Stay Timeless',
    'classical-melody-palo-alto',
    'Stone, plaster, metal, and proportion choices that keep a fireplace from looking dated.',
    'fireplace,materials,living room,stone',
    [
      {
        title: 'The surround sets the room',
        text: 'A fireplace is usually the strongest visual anchor in a living room. Its material, width, depth, and relation to built-ins affect the entire wall.',
      },
      {
        title: 'Avoid over-designing the hearth',
        text: 'Timeless fireplaces often use fewer moves: one confident surface, clean transitions, and a scale that respects the furniture plan.',
      },
      {
        title: 'Let texture do the work',
        text: 'Honed stone, limewash, plaster, or warm metal can add atmosphere without forcing the fireplace to become a decorative object.',
      },
    ],
  ),
];

async function main() {
  const localEnv = readLocalEnvFile();
  const rawDatabaseUrl = getEnvValue(localEnv, 'DATABASE_URL', 'file:./server/prisma/dev.db');
  process.env.DATABASE_URL = normalizeSqliteDatabaseUrl(rawDatabaseUrl, process.cwd());

  const backupPath = backupSqliteDatabase(process.env.DATABASE_URL);
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const now = new Date().toISOString();

  let updated = 0;
  for (const item of articles) {
    if (!item.coverImage) {
      console.warn(`[skip] ${item.slug}: no local images found for ${item.projectSlug}`);
      continue;
    }

    const data = {
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      coverImage: item.coverImage,
      content: JSON.stringify(makeBlocks(item)),
      isPublished: true,
      publishedAt: now,
      tags: item.tags,
      seoTitle: `${item.title} | Alexandra Diz`,
      seoDescription: item.excerpt,
      seoKeywords: item.tags,
      updatedAt: now,
    };

    await prisma.blogPost.upsert({
      where: { slug: item.slug },
      update: data,
      create: {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
      },
    });
    updated += 1;
  }

  console.log(`Blog block posts seeded: ${updated}`);
  if (backupPath) console.log(`Backup: ${backupPath}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
