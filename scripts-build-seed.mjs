import fs from 'fs';
import path from 'path';

const root = path.resolve('public/legacy');
const outDir = path.resolve('server/data');

const categoryMeta = {
  kitchens: { id: 'kitchens', name: 'Kitchens', homeTitle: 'Kitchen Remodeling Projects' },
  'full-house-remodeling': { id: 'full-house-remodeling', name: 'Full House Remodeling', homeTitle: 'Full House Remodeling Projects' },
  bathrooms: { id: 'bathrooms', name: 'Bathrooms', homeTitle: 'Bathroom Remodeling Projects' },
  adu1: { id: 'adu1', name: 'ADU', homeTitle: 'ADU Projects' },
  fireplaces: { id: 'fireplaces', name: 'Fireplaces', homeTitle: 'Fireplace Projects' },
  'projects-before-and-after': { id: 'projects-before-and-after', name: 'Before & After', homeTitle: 'Before and After Projects' }
};

function walk(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile() && entry.name === 'index.html') acc.push(full);
  }
  return acc;
}

function matchMeta(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

function extractImages(html) {
  const urls = new Set();
  const re = /(?:src|data-src|data-src2x|content)="(https?:\/\/[^"\s>]+(?:jpg|jpeg|png|webp))/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    urls.add(m[1]);
    if (urls.size >= 8) break;
  }
  return Array.from(urls);
}

function sentenceFor(title, categoryName) {
  return `A ${categoryName.toLowerCase()} project focused on clean composition, balanced materials, and practical day-to-day comfort.`;
}

function workDoneFor(categoryName) {
  const map = {
    Kitchens: 'Space planning, cabinet layout, lighting strategy, finish selection, and installation coordination.',
    'Full House Remodeling': 'Complete interior remodeling scope including layout updates, finishes, and room-to-room continuity.',
    Bathrooms: 'Bathroom planning, tile and fixture selection, lighting updates, and storage optimization.',
    ADU: 'ADU planning with compact layout optimization, full finish package, and construction-ready detailing.',
    Fireplaces: 'Fireplace wall redesign, material refinement, surround detailing, and integrated decor styling.',
    'Before & After': 'Transformation planning from existing conditions to final look, with clear visual and functional improvements.'
  };
  return map[categoryName] || 'Concept, materials, and implementation support.';
}

const htmlFiles = walk(root);
const projects = [];
let id = 1;

for (const file of htmlFiles) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const parts = rel.split('/');
  if (parts.length < 3) continue;

  const [categoryDir, projectDir] = parts;
  const category = categoryMeta[categoryDir];
  if (!category) continue;
  if (projectDir === 'index.html') continue;

  const html = fs.readFileSync(file, 'utf8');
  const title = matchMeta(html, /<title>([^<]+)<\/title>/i) || projectDir;
  const ogUrl = matchMeta(html, /<meta\s+property="og:url"\s+content="([^"]+)"/i);
  const ogDescription = matchMeta(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const images = extractImages(html);
  const coverImage = images[0] || '';

  let slug = projectDir.toLowerCase();
  if (ogUrl) {
    try {
      const u = new URL(ogUrl);
      slug = u.pathname.replace(/^\//, '') || slug;
    } catch {}
  }

  projects.push({
    id: String(id++),
    title,
    slug,
    categoryId: category.id,
    location: '',
    year: '',
    coverImage,
    gallery: images,
    summary: ogDescription || sentenceFor(title, category.name),
    workDone: workDoneFor(category.name),
    featuredOnHome: false,
    published: true
  });
}

for (const cat of Object.values(categoryMeta)) {
  const firstThree = projects.filter((p) => p.categoryId === cat.id).slice(0, 3);
  for (const p of firstThree) p.featuredOnHome = true;
}

const content = {
  site: {
    name: 'Alexandra Diz Architecture',
    phone: '+1 415 769 8563',
    email: 'alexandra@alexandradiz.com',
    instagram: 'https://www.instagram.com/alexandra_diz/',
    facebook: 'https://www.facebook.com/alexadiz',
    houzz: 'https://www.houzz.com/pro/alexandra-diz/alexandra-diz-architecture'
  },
  sections: [
    { id: 'projects', name: 'Projects', type: 'home-anchor' },
    { id: 'kitchens', name: 'Kitchens', type: 'category' },
    { id: 'full-house-remodeling', name: 'Full house remodeling', type: 'category' },
    { id: 'bathrooms', name: 'Bathroom', type: 'category' },
    { id: 'adu1', name: 'ADU', type: 'category' },
    { id: 'projects-before-and-after', name: 'Projects before and after', type: 'category' },
    { id: 'fireplaces', name: 'Fireplaces', type: 'category' },
    { id: 'contact', name: 'Contact', type: 'page', slug: 'contact' }
  ],
  categories: Object.values(categoryMeta),
  pages: {
    about: {
      title: 'About',
      body: 'Studio-led interior architecture and remodeling design with a strong focus on livable elegance and practical detail.'
    },
    services: {
      title: 'Services',
      body: 'Full interior design, kitchen remodeling, bathroom remodeling, and complete house transformation support.'
    },
    contact: {
      title: 'Contact',
      body: 'For project inquiries, use the contacts below or reach out through social channels.'
    }
  },
  projects
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'content.json'), JSON.stringify(content, null, 2));
console.log(`Seeded ${projects.length} projects.`);
