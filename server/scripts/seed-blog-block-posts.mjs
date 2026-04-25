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
      id: 'blog-side-by-side',
      type: 'sideBySide',
      data: {
        title: article.visualTitle || article.sections[0].title,
        text: article.visualText || article.sections[0].text,
        image: images[1] || cover,
        alt: article.title,
        imagePosition: article.imagePosition || 'right',
      },
    },
    {
      id: 'blog-cta',
      type: 'ctaSection',
      data: {
        title: 'Planning your own remodel?',
        text: `Bring the room, the constraints, and the references. Alexandra Diz Architecture can turn them into a composed design direction.`,
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
    visualTitle: sections[0]?.title,
    visualText: sections[0]?.text,
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
        text: `The strongest kitchens are not trend collections. They use current ideas to improve flow, storage, atmosphere, and the way the family actually cooks. In practice, that means checking every trend against the client's routine: where groceries land, how often the island is used, what needs to be visible, and what should disappear after dinner. A kitchen can feel current without chasing novelty if the planning is specific.

Start with the plan before choosing finishes. If storage, appliance zones, and circulation are weak, even beautiful stone and lighting will feel decorative instead of useful. The best 2026 kitchens are quieter, warmer, and more edited, but they still work because the hidden decisions are strong.`,
      },
      {
        title: 'Warmth is replacing sterile contrast',
        text: `Soft whites, natural wood, honed stone, muted color, and warmer metals are becoming more useful than hard black-and-white contrast. This does not mean everything has to become beige. It means contrast is handled with texture and depth instead of sharp graphic edges.

A warm kitchen might use oak, creamy stone, aged brass, and a single deeper cabinet tone. The result is easier to live with because the palette responds well to daylight, evening light, and the visual mess of real cooking.`,
      },
      {
        title: 'Storage is becoming quieter',
        text: `Hidden pantries, integrated appliances, cleaner appliance zones, and fewer exposed objects are making kitchens feel calmer and more architectural. The important part is not hiding everything for the sake of minimalism; it is deciding what deserves to be visible.

Coffee equipment, oils, trays, cutting boards, cleaning products, pet bowls, and charging cables need a real home. When those details are planned early, the finished kitchen photographs better and functions better after move-in.`,
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
        text: `A timeless bathroom starts with how the room is used: morning pace, storage needs, shower habits, cleaning expectations, and whether the space should feel energizing or restorative. Before choosing tile, define the daily sequence: who uses the room, how much counter space is needed, whether a tub is actually used, and where towels and products will live.

This prevents the most common remodel mistake: selecting beautiful surfaces before the room has a clear functional logic. A bathroom that ages well usually has a simple layout, strong ventilation, enough storage, and lighting that supports both task and atmosphere.`,
      },
      {
        title: 'Choose materials by durability and mood',
        text: `Tile, stone, vanity finish, and metal should be tested together. The right palette carries moisture, light, and daily use without feeling visually busy. A sample that looks quiet in a showroom can become flat in a shaded bathroom, while a dramatic tile can overwhelm a small room once grout lines and reflections are added.

For longevity, choose one lead material and let the others support it. If the stone has movement, keep tile calmer. If the tile has pattern, use a simpler counter. This hierarchy keeps the bathroom from feeling dated too quickly.`,
      },
      {
        title: 'Lighting makes the room age well',
        text: `Layered light around mirrors, ceiling zones, and architectural features keeps the bathroom practical while giving the finishes depth. Mirror lighting should flatter faces without shadows; ceiling lighting should be clean and evenly placed; accent lighting should be used only where it supports architecture.

The goal is not to add more fixtures, but to control mood. A bathroom can feel hotel-level when the light temperature, mirror placement, and material reflectance are coordinated early.`,
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
        text: `A good ADU is not a leftover room. It needs its own rhythm, storage, light, durable finishes, and enough identity to feel like a small home. Because the footprint is compact, every decision is visible: door swings, appliance size, window placement, storage depth, and how the entry feels.

The best ADUs are planned like small, complete residences. They avoid oversized gestures and rely on clarity: a clean kitchen wall, integrated storage, durable floors, and a bathroom that feels intentional rather than squeezed in.`,
      },
      {
        title: 'Flexibility drives value',
        text: `Guest suite, rental, office, studio, or family support: the plan should be simple enough to shift over time without major reconstruction. A flexible ADU benefits from neutral durable finishes, good acoustic separation, strong lighting, and built-ins that do not lock the space into only one use.

If rental income is part of the goal, maintenance matters as much as aesthetics. Materials should be easy to repair, appliances should be serviceable, and storage should make small-space living realistic.`,
      },
      {
        title: 'Small scale needs discipline',
        text: `Compact square footage rewards fewer materials, smarter built-ins, and clear sightlines. Every decision has to work harder. Keeping flooring continuous, using consistent trim logic, and limiting the number of finish transitions can make a small unit feel larger.

Good ADU design is not about making the space look like a miniature version of the main house. It is about making the unit feel complete, calm, and useful on its own terms.`,
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
        text: `A timeless fireplace gives the room weight. It does not need too many decorative moves if the surround, hearth, and adjacent wall are proportioned well. The first decision is scale: how wide the fireplace wall should feel, how deep the hearth can be, and whether the firebox should read as traditional, modern, or quietly transitional.

A fireplace becomes dated when too many trends compete on the same wall. One strong material, clean edges, and careful relation to furniture usually lasts longer than a complicated feature wall.`,
      },
      {
        title: 'Material restraint lasts longer',
        text: `Stone, plaster, brick, or metal should support the architecture. One confident material often ages better than a busy mix. Honed limestone, marble, limewash, textured plaster, or simple brick can all work, but the material has to match the room's proportions and light.

If the fireplace shares a wall with shelving, art, or a television, restraint becomes even more important. The surround should anchor the composition without fighting every other element.`,
      },
      {
        title: 'Built-ins need breathing room',
        text: `Shelving, art, and mantel details should frame the fire without crowding it. Negative space is part of the composition. Built-ins should be planned with real objects in mind: books, ceramics, concealed equipment, firewood, or media components.

When the surrounding wall is resolved, the fireplace feels integrated rather than applied. That is what makes it timeless: the room would feel incomplete without it.`,
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
        text: `Marble should not be selected as a standalone object. The right choice depends on cabinet tone, daylight, faucet finish, grout color, and how much visual movement the room can hold. A slab that looks extraordinary at the stone yard may feel too loud once it is wrapped around an island or carried up a backsplash.

Start by defining the role of marble in the room. Is it the main focal point, a quiet supporting texture, or a luxury detail in one controlled zone? That answer determines whether you need dramatic veining, a softer field, or a porcelain alternative with less maintenance.`,
      },
      {
        title: 'Veining needs proportion',
        text: `A dramatic slab can make a kitchen feel intentional, but only when the island, backsplash, and vertical surfaces have enough breathing room. Smaller bathrooms often need calmer veining or a single controlled focal wall. Scale matters more than trend: large veining needs distance to be appreciated.

Before approving a slab, map where the seams will land and how the vein direction will continue. Poor seam placement can make expensive stone look accidental. Good bookmatching or careful slab selection can make even a restrained marble feel custom.`,
      },
      {
        title: 'Maintenance is part of the aesthetic',
        text: `Natural marble patinas. That is beautiful when the client wants softness and history, but it is the wrong promise if the expectation is a perfect showroom surface forever. Acid, water, oils, and daily use can change the surface. Honed finishes hide wear more gracefully than polished finishes, but they still need realistic expectations.

For busy kitchens, consider using marble where touch and visibility matter most, then pairing it with more durable surfaces elsewhere. A stone choice is successful when the owner understands how it will live, not only how it photographs.`,
      },
      {
        title: 'Where porcelain makes sense',
        text: `Porcelain can be the better technical choice for shower walls, rental units, or high-maintenance households. The strongest projects are honest about where natural stone matters and where performance should lead. In wet zones, porcelain can reduce staining, simplify cleaning, and still deliver a calm stone-like plane.

Use real marble where its depth and touch are worth the maintenance: a vanity, fireplace, powder room, or feature surface. Use performance materials where water, traffic, and cleaning demands are higher.`,
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
        text: `Natural stone is strongest on surfaces people notice up close: vanity tops, feature walls, fireplace surrounds, and moments where texture can carry the room. It brings depth because each slab has variation, translucency, and mineral movement that manufactured materials cannot fully duplicate.

Use it when the material is part of the emotional value of the room. A powder room vanity, fireplace face, or entry detail can justify natural stone because people experience it as a crafted moment.`,
      },
      {
        title: 'Use porcelain where water wins',
        text: `Porcelain is often the sharper choice inside showers and wet zones because it resists staining, reduces maintenance anxiety, and still gives a clean architectural plane. Large-format porcelain can reduce grout lines and make a bathroom feel visually calmer.

The mistake is pretending porcelain and stone are the same. They are different tools. Porcelain offers performance and consistency; stone offers depth and character. A good specification uses each where it is strongest.`,
      },
      {
        title: 'The best rooms mix both',
        text: `A sophisticated interior does not need one material everywhere. It needs hierarchy: one expressive surface, several quiet supporting surfaces, and details that make the transition feel intentional. If every surface tries to be special, the room becomes noisy.

Choose the hero material first, then make the supporting materials calmer. This is how a bathroom or kitchen can feel rich without feeling busy.`,
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
        text: `Lighting is not decoration added at the end. It determines how material color reads, how deep a room feels, and whether the most expensive finishes actually look resolved. A beautiful stone can turn gray under the wrong temperature; a warm cabinet can become orange; a textured wall can disappear without grazing light.

Lighting should be planned while the layout and materials are still flexible. That is when ceiling positions, wall sconces, under-cabinet lighting, and dimming zones can be coordinated instead of patched in.`,
      },
      {
        title: 'Every zone needs a job',
        text: `Task lighting belongs where people cook, read, apply makeup, or move through cabinetry. Ambient lighting sets comfort. Accent lighting gives architecture a quiet rhythm. Each layer should have a reason, and each should be dimmable when possible.

In kitchens, under-cabinet light and island lighting should support work without glare. In bathrooms, mirror lighting matters more than decorative ceiling fixtures. In living rooms, accent light can bring depth to shelving, stone, or artwork.`,
      },
      {
        title: 'Decorative fixtures need restraint',
        text: `Pendants and sconces should not compete with every other line in the room. They work best when they anchor a view, repeat a finish, or soften a hard architectural edge. A fixture can be sculptural, but it still has to respect proportion and sightlines.

The best lighting plans feel effortless because the technical layer is resolved. Decorative fixtures then become atmosphere, not compensation for a poorly lit room.`,
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
        text: `Two kitchens with the same footprint can need completely different storage. Cooking style, hosting habits, small appliances, pantry expectations, and cleanup rhythm all change the plan. Before cabinet elevations are finalized, list what actually needs to live in the kitchen.

This includes everyday dishes, bulk pantry goods, trays, baking tools, coffee equipment, cleaning supplies, pet items, and occasional entertaining pieces. The list is not glamorous, but it is what makes the finished kitchen feel calm.`,
      },
      {
        title: 'Plan the invisible first',
        text: `Trash, trays, cleaning supplies, oils, coffee, charging, and pet items are the details that decide whether a kitchen feels calm after move-in. If these are not planned, they migrate to counters and corners.

Good storage design creates zones: prep, cooking, cleanup, serving, pantry, and daily rituals. Once those zones are clear, cabinet faces can be composed beautifully without sacrificing function.`,
      },
      {
        title: 'Cabinet beauty follows function',
        text: `Once storage logic is clear, door proportions, open shelves, appliance panels, and stone edges can be composed without forcing the room to perform badly. The best cabinet design hides complexity behind simple elevations.

Open shelves should be used where they support the composition, not as a substitute for storage. Deep drawers, appliance garages, pantry pullouts, and integrated panels often do more for a premium feeling than adding another decorative finish.`,
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
        text: `Before tile or fixtures, the plan needs to resolve clearances, door swings, shower dimensions, plumbing constraints, and where the eye lands when the room opens. Bathrooms are small, so layout mistakes are felt every day.

Check the practical sequence first: entry, vanity use, shower access, towel placement, storage, ventilation, and cleaning. A good bathroom plan feels easy before it feels luxurious.`,
      },
      {
        title: 'Tile should support scale',
        text: `Large format tile can calm a small room, while smaller tile can bring craft and rhythm. The right answer depends on proportion, not trend. A large tile can reduce grout lines, but it may require careful cuts and flatter walls. A smaller tile can add texture but may become visually busy.

Choose tile after the layout is resolved. Then test grout color, edge profiles, niche placement, and where the tile starts and stops. These details determine whether the room feels designed or merely renovated.`,
      },
      {
        title: 'Storage prevents visual noise',
        text: `A bathroom feels premium when everyday objects have a place. Niches, drawers, medicine cabinets, and linen storage are part of the design, not afterthoughts. Storage also affects how clean the design reads in real life.

If the goal is a calm bathroom, plan where products disappear. A beautiful vanity will not feel luxurious if the counter is the only available storage surface.`,
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
        text: `A warm neutral interior needs texture, depth, and disciplined contrast. Without those layers, it becomes flat; with them, it feels composed and expensive. The key is to make quiet materials do different jobs.

A warm white wall, pale oak cabinet, honed stone, linen shade, and brushed metal may all be neutral, but each carries a different texture and reflectance. Together they create depth without relying on strong color.`,
      },
      {
        title: 'Texture carries the palette',
        text: `Wood grain, honed stone, fabric, plaster, and brushed metal let a restrained palette feel tactile instead of plain. Texture is what keeps minimalism from feeling empty.

When the palette is soft, lighting becomes even more important. Grazing light on plaster, daylight across stone, and warmer evening lamps can make the same neutral room feel layered throughout the day.`,
      },
      {
        title: 'Restraint needs one anchor',
        text: `A darker vanity, a stronger stone vein, or a sculptural fixture gives the room a focal point while preserving quietness around it. Warm minimalism still needs hierarchy.

Choose one anchor and let the surrounding details recede. This keeps the room calm while preventing it from becoming generic.`,
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
        text: `An ADU becomes stronger when the palette is focused, storage is integrated, and every view has a clear job. Small spaces expose every unresolved detail, so the design has to be more disciplined than in a large house.

Use fewer finish transitions, continuous flooring, and simple cabinetry lines. Then spend attention on the moments people touch every day: hardware, lighting, countertop edges, and storage access.`,
      },
      {
        title: 'Flexibility adds value',
        text: `A compact unit might need to work as guest suite, office, rental, or multigenerational space. Built-ins, lighting scenes, and durable finishes help the plan adapt. Flexibility is not about making the design vague; it is about avoiding decisions that trap the space into one narrow use.

A wall bed, built-in desk, compact dining surface, or concealed storage can make the same room support multiple routines without visual clutter.`,
      },
      {
        title: 'Exterior and interior should agree',
        text: `The best ADUs do not feel like detached afterthoughts. They share material logic with the main home while keeping enough identity to feel complete. Exterior materials, window proportions, and landscape transitions matter as much as the interior.

When the ADU belongs to the property visually, it adds value beyond square footage. It feels planned, not improvised.`,
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
        text: `A fireplace is usually the strongest visual anchor in a living room. Its material, width, depth, and relation to built-ins affect the entire wall. Before choosing stone or tile, decide what role the fireplace plays: formal center, relaxed gathering point, or quiet architectural background.

That role determines the material scale, mantel height, hearth depth, and whether surrounding storage should be symmetrical or more relaxed.`,
      },
      {
        title: 'Avoid over-designing the hearth',
        text: `Timeless fireplaces often use fewer moves: one confident surface, clean transitions, and a scale that respects the furniture plan. Over-designed fireplace walls can age quickly because every trim line, niche, and shelf becomes a timestamp.

A simpler wall with better proportions usually feels more expensive. Let the material and firebox sit correctly before adding decoration.`,
      },
      {
        title: 'Let texture do the work',
        text: `Honed stone, limewash, plaster, or warm metal can add atmosphere without forcing the fireplace to become a decorative object. Texture creates interest without noise.

The most successful fireplace walls feel inevitable: the furniture points toward them, the lighting supports them, and the surrounding details do not compete.`,
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
      content: JSON.stringify({
        blocks: makeBlocks(item),
        article: item.sections,
      }),
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
