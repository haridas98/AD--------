import { PrismaClient } from '@prisma/client';

const APPLY = process.argv.includes('--apply');
const API_MODE = process.argv.includes('--api');
const DB_MODE = process.argv.includes('--db') || !API_MODE;
const BASE_URL = process.env.ADMIN_BASE_URL || 'http://127.0.0.1:8787';
const USERNAME = process.env.ADMIN_USER || 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const cityWords = [
  'Belmont',
  'Berkeley',
  'Boulder',
  'Cupertino',
  'Foster City',
  'Fremont',
  'Livermore',
  'Los Altos',
  'Los Gatos',
  'Menlo Park',
  'Mountain View',
  'Oakland',
  'Pacifica',
  'Palo Alto',
  'Pleasanton',
  'Redwood City',
  'Rishon LeZion',
  'San Bruno',
  'San Carlos',
  'San Francisco',
  'San Jose',
  'Saratoga',
  'Sunnyvale',
  'Walnut Creek',
];

const slugMetadata = {
  'alexandra-san-jose-2020': { cityName: 'San Jose', year: 2020, completedAt: '2020' },
  'belmond': { cityName: 'Belmont', year: 2020, completedAt: '2020' },
  'belmond-2441-coronet': { cityName: 'Belmont', year: 2020, completedAt: '2020' },
  'belmond-2441-coronet-2': { cityName: 'Belmont', year: 2020, completedAt: '2020' },
  'broadway-oakland-4th': { cityName: 'Oakland' },
  'brookside': { cityName: 'Berkeley' },
  'brookside-berkeley': { cityName: 'Berkeley' },
  'brookside-berkley': { cityName: 'Berkeley' },
  'chauncey': { cityName: 'San Jose' },
  'chauncey1': { cityName: 'San Jose' },
  'elka': { cityName: 'San Jose', year: 2023, completedAt: '2023' },
  'glasgow': { cityName: 'San Carlos' },
  'livermore': { cityName: 'Livermore', year: 2019, completedAt: '2019' },
  'mountain-view': { cityName: 'Mountain View' },
  'mountainview': { cityName: 'Mountain View' },
  'oakland': { cityName: 'Oakland' },
  'oakland-5073': { cityName: 'Oakland' },
  'paseo-olivos': { year: 2024, completedAt: '2024' },
  'paseo-olivos-20240531t180128z-001': { year: 2024, completedAt: '2024' },
  'pleasanton-foothill': { cityName: 'Pleasanton' },
  'pleasanton-regency': { cityName: 'Pleasanton' },
  'rishon-israel': { cityName: 'Rishon LeZion' },
  'rita-bathrooms': {},
  'san-jose': { cityName: 'San Jose' },
  'san-jose-residence': { cityName: 'San Jose', year: 2020, completedAt: '2020' },
  'sunnyvale': { cityName: 'Sunnyvale', year: 2021, completedAt: '2021' },
  'sunnyvale-990': { cityName: 'Sunnyvale', year: 2021, completedAt: '2021' },
  'teredo': { cityName: 'Redwood City' },
  'walnut-creek': { cityName: 'Walnut Creek' },
};

const slugTitleOverrides = {
  'Boulderadu': 'ADU',
  'bathroom-in-victorian-style-palo-alto': 'Victorian Bathroom',
  'belmond-2441-coronet': 'Belmond Coronet',
  'belmond-2441-coronet-2': 'Belmond Coronet',
  'blue-geometry-los-altos': 'Blue Geometry',
  'blue-depth-oakland': 'Blue Depth',
  'bright-mood-pacifica': 'Bright Mood',
  'california-ocean-house-in-paccifica': 'Ocean House',
  'classical-melody-palo-alto': 'Classical Melody',
  'clear-lines-house': 'Clear Lines House',
  'corner-of-happiness-san-francisco': 'Corner of Happiness',
  'cozy-home-in-menlo-park-ca': 'Cozy Home',
  'dark-gold-los-altos': 'Dark Gold',
  'foster-city': 'Bathroom',
  'fremont': 'House',
  'green-symphony-pacifica': 'Green Symphony',
  'house-in-san-carlos': 'House',
  'house-of-thoughts-redwood-city': 'House of Thoughts',
  'japandi-fremont': 'Japandi',
  'jungle-whisper-san-carlos': 'Jungle Whisper',
  'light-of-wood-san-jose': 'Light of Wood',
  'lightness-of-wood-san-jose': 'Lightness of Wood',
  'los-altos': 'House',
  'los-gatos': 'Bathroom',
  'marble-mist-kitchen-san-carlos': 'Marble Mist Kitchen',
  'menlo-park': 'Contemporary House',
  'menlopark': 'Modern House',
  'modern-bathroom-san-carlos': 'Modern Bathroom',
  'modern-design-house-cupertino': 'Modern Design House',
  'modern-kitchen-in-sunnyvale': 'Modern Kitchen',
  'mountainview': 'House',
  'mountain-view': 'Harmony of Nature',
  'noble-luxury-san-jose': 'Noble Luxury',
  'oakland': 'Kitchen',
  'oakland-5073': 'Bathroom',
  'pacifica-cypress': 'Cypress Kitchen',
  'palo-alto-800': 'Bathroom',
  'palo-alto-kitchen': 'Kitchen',
  'peace-of-mind-los-altos': 'Peace of Mind',
  'quiet-comfort-san-jose': 'Quiet Comfort',
  'redwood-citybathroom': 'Bathroom',
  'relax-oasis': 'Relax Oasis',
  'safe-haven-cupertino': 'Safe Haven',
  'san-bruno': 'Bathroom',
  'san-bruno-1': 'Kitchen',
  'hull': 'Bathroom',
  'san-carlos': 'Bathroom',
  'hullkitchen': 'Kitchen',
  'san-carlos-chestnut': 'Chestnut Bathroom',
  'san-carlos-modern-kitchen': 'Modern Kitchen',
  'san-jose-1574': 'Kitchen',
  'san-jose-4265': 'Bathroom',
  'san-jose-bathroom': 'Elegant Minimalism',
  'san-jose-california-in-progress': 'House',
  'Saratoga': 'House',
  'Saratoga-2': 'Kitchen',
  'Saratoga-3': 'Bathroom',
  'shades-of-blue-pacifica': 'Shades of Blue',
  'small-kitchen-oakland': 'Small Kitchen',
  'sophisticated-dream-oakland': 'Sophisticated Dream',
  'sparkling-graphite-los-altos': 'Sparkling Graphite',
  'stylish-solution-san-jose': 'Stylish Solution',
  'sunny-house-redwood-city': 'Sunny House',
  'sunnyvale-990': 'Kitchen',
  'chauncey': 'Velvet Green',
  'chauncey1': 'Bathroom',
  'rio-vistakit': 'Kitchen',
  'victorian-style-palo-alto': 'Victorian Style',
  'warm-evening-fremont': 'Warm Evening',
  'warm-kitchen-oakland': 'Warm Kitchen',
  'white-wings-san-jose': 'White Wings',
  'wooden-comfort-kitchen-fremont': 'Wooden Comfort Kitchen',
};

function titleCase(value) {
  return String(value || '').replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function normalizeCity(value) {
  const clean = String(value || '').replace(/\bCA\b|California|USA|,\s*$/gi, '').replace(/\s+/g, ' ').trim();
  const known = cityWords.find((city) => city.toLowerCase() === clean.toLowerCase());
  return known || titleCase(clean);
}

function cityFromText(value) {
  const text = String(value || '').replace(/-/g, ' ');
  return cityWords.find((city) => new RegExp(`\\b${city.replace(/\s+/g, '\\s+')}\\b`, 'i').test(text)) || '';
}

function fallbackTitleForCategory(categorySlug) {
  if (categorySlug === 'kitchens') return 'Kitchen';
  if (categorySlug === 'bathrooms') return 'Bathroom';
  if (categorySlug === 'adu1') return 'ADU';
  if (categorySlug === 'fireplaces') return 'Fireplace';
  return 'House';
}

function cleanProjectTitle(project) {
  const override = slugTitleOverrides[project.slug];
  if (override) return override;

  const originalTitle = String(project.title || '').trim();
  let title = originalTitle;
  let changed = false;
  title = title.replace(/\s{2,}/g, ' ');
  const withoutStateOnly = title.replace(/\s*\((?:CA|California)\)\s*$/i, '');
  if (withoutStateOnly !== title) {
    title = withoutStateOnly;
    changed = true;
  }

  for (const city of cityWords) {
    const cityPattern = city.replace(/\s+/g, '\\s+');
    const nextTitle = title
      .replace(new RegExp(`\\s*\\((?:${cityPattern})(?:,?\\s*(?:CA|California|USA))?\\)\\s*$`, 'i'), '')
      .replace(new RegExp(`,\\s*(?:${cityPattern})(?:,?\\s*(?:CA|California|USA))?\\s*$`, 'i'), '')
      .replace(new RegExp(`\\s+in\\s+(?:${cityPattern})(?:,?\\s*(?:CA|California|USA))?\\s*$`, 'i'), '');
    if (nextTitle !== title) {
      title = nextTitle;
      changed = true;
    }
  }

  title = title.replace(/\s{2,}/g, ' ').trim();

  if (!title || cityWords.some((city) => city.toLowerCase() === title.toLowerCase())) {
    return fallbackTitleForCategory(project.category?.slug);
  }

  return changed ? titleCase(title) : originalTitle;
}

function inferMetadata(project) {
  const override = slugMetadata[project.slug] || {};
  const sourceText = [
    project.slug,
    project.title,
    project.assets?.map((asset) => asset.sourcePath).join(' '),
  ].filter(Boolean).join(' ');
  const cityName = override.cityName || project.cityName || cityFromText(sourceText);
  const datedFolderYear = String(sourceText).match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|June|Jul|July|Aug|August|Sep|Oct|Nov|Dec)[a-z]*[\s._-]+(?:0?[1-9]|[12]\d|3[01])?(?:st|nd|rd|th)?[\s._-]+(201[0-9]|202[0-6])\b/i)?.[1]
    || String(sourceText).match(/\b(201[0-9]|202[0-6])(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\b/)?.[1];
  const shortYear = String(sourceText).match(/\b(?:0?[1-9]|1[0-2])[-_. ](?:0?[1-9]|[12]\d|3[01])[-_. ](2[0-6])\b/)?.[1];
  const year = override.year || project.year || (datedFolderYear ? Number(datedFolderYear) : shortYear ? Number(`20${shortYear}`) : null);
  const title = cleanProjectTitle({ ...project, cityName: cityName || project.cityName });

  return {
    title,
    cityName: cityName ? normalizeCity(cityName) : '',
    year,
    completedAt: override.completedAt || project.completedAt || (year ? String(year) : ''),
  };
}

async function request(pathname, options = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${options.method || 'GET'} ${pathname} failed ${response.status}: ${text}`);
  }
  return response.json();
}

async function loadApiProjects() {
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const headers = {
    authorization: `Bearer ${login.token}`,
    'content-type': 'application/json',
  };
  const content = await request('/api/admin/content', { headers });
  return { projects: content.projects, headers };
}

async function runApi() {
  const { projects, headers } = await loadApiProjects();
  const changes = [];

  for (const project of projects) {
    const next = inferMetadata(project);
    const changed = next.title !== project.title
      || next.cityName !== (project.cityName || '')
      || String(next.year || '') !== String(project.year || '')
      || next.completedAt !== (project.completedAt || '');
    if (!changed) continue;

    changes.push({ slug: project.slug, from: project.title, to: next.title, cityName: next.cityName, year: next.year || '', completedAt: next.completedAt });
    if (!APPLY) continue;

    await request(`/api/admin/projects/${project.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title: next.title,
        slug: project.slug,
        categoryId: project.categoryId,
        content: JSON.stringify(project.content || []),
        isFeatured: project.isFeatured,
        isPublished: project.isPublished,
        stylePreset: project.stylePreset || 'default',
        seoTitle: project.seoTitle || '',
        seoDescription: project.seoDescription || '',
        seoKeywords: project.seoKeywords || '',
        cityName: next.cityName,
        year: next.year || '',
        completedAt: next.completedAt,
        deletedAt: '',
      }),
    });
  }

  return changes;
}

async function runDb() {
  const prisma = new PrismaClient();
  const projects = await prisma.project.findMany({
    include: {
      category: true,
      assets: { select: { sourcePath: true } },
    },
  });
  const changes = [];

  for (const project of projects) {
    const next = inferMetadata(project);
    const changed = next.title !== project.title
      || next.cityName !== (project.cityName || '')
      || String(next.year || '') !== String(project.year || '')
      || next.completedAt !== (project.completedAt || '');
    if (!changed) continue;

    changes.push({ slug: project.slug, from: project.title, to: next.title, cityName: next.cityName, year: next.year || '', completedAt: next.completedAt });
    if (!APPLY) continue;

    await prisma.project.update({
      where: { id: project.id },
      data: {
        title: next.title,
        cityName: next.cityName || null,
        year: next.year || null,
        completedAt: next.completedAt || null,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  await prisma.$disconnect();
  return changes;
}

const changes = DB_MODE ? await runDb() : await runApi();
console.log(JSON.stringify({ mode: APPLY ? 'APPLY' : 'DRY_RUN', target: API_MODE ? BASE_URL : 'database', count: changes.length, changes }, null, 2));
