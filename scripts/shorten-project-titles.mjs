const BASE_URL = process.env.ADMIN_BASE_URL || 'http://127.0.0.1:8787';
const USERNAME = process.env.ADMIN_USER || 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const APPLY = process.argv.includes('--apply');

const cityWords = [
  'Berkeley',
  'Cupertino',
  'Fremont',
  'Los Altos',
  'Menlo Park',
  'Oakland',
  'Pacifica',
  'Palo Alto',
  'Redwood City',
  'San Bruno',
  'San Carlos',
  'San Francisco',
  'San Jose',
  'Saratoga',
];

function titleCase(value) {
  return String(value || '').replace(/\b\w/g, (char) => char.toUpperCase());
}

function cleanTitle(project) {
  const title = String(project.title || '').trim();
  let city = project.cityName || '';
  let next = title;

  const commaMatch = title.match(/^(.+?),\s*([A-Za-z ]+)$/);
  if (commaMatch && cityWords.some((word) => word.toLowerCase() === commaMatch[2].toLowerCase())) {
    next = commaMatch[1].trim();
    city ||= titleCase(commaMatch[2].trim());
  }

  const parentheticalCity = next.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (parentheticalCity && cityWords.some((word) => word.toLowerCase() === parentheticalCity[2].toLowerCase())) {
    next = parentheticalCity[1].trim();
    city ||= titleCase(parentheticalCity[2].trim());
  }

  return { title: next, cityName: city };
}

async function request(pathname, options = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${options.method || 'GET'} ${pathname} failed ${response.status}: ${text}`);
  }
  return response.json();
}

const login = await request('/api/auth/login', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
});

const headers = { authorization: `Bearer ${login.token}` };
const jsonHeaders = { ...headers, 'content-type': 'application/json' };
const content = await request('/api/admin/content', { headers });
const changes = [];

for (const project of content.projects) {
  const next = cleanTitle(project);
  if (next.title === project.title && next.cityName === (project.cityName || '')) continue;

  changes.push({
    slug: project.slug,
    from: project.title,
    to: next.title,
    cityName: next.cityName,
  });

  if (!APPLY) continue;

  await request(`/api/admin/projects/${project.id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({
      title: next.title,
      slug: project.slug,
      categoryId: project.categoryId,
      content: JSON.stringify(project.content || []),
      isFeatured: project.isFeatured,
      isPublished: project.isPublished,
      stylePreset: project.stylePreset || 'default',
      sortOrder: project.sortOrder || 0,
      seoTitle: project.seoTitle || '',
      seoDescription: project.seoDescription || '',
      seoKeywords: project.seoKeywords || '',
      cityName: next.cityName,
      year: project.year || '',
      completedAt: project.completedAt || '',
      deletedAt: '',
    }),
  });
}

console.log(JSON.stringify({ mode: APPLY ? 'APPLY' : 'DRY_RUN', changes }, null, 2));
