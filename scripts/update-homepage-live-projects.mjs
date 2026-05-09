const BASE_URL = process.env.ADMIN_BASE_URL || 'http://127.0.0.1:8787';

const kitchenSlugs = [
  'belmond',
  'warm-kitchen-oakland',
  'modern-kitchen-in-sunnyvale',
  'pure-elegance-kitchen',
  'oakland',
];

const approachSlug = 'san-carlos-modern-kitchen';

const bathroomSlugs = [
  'foster-city',
  'lightness-of-wood-san-jose',
  'los-gatos',
  'oakland-5073',
  'palo-alto-800',
  'relax-oasis',
  'san-bruno',
  'shades-of-blue-pacifica',
];

const detailSlugs = [
  'california_boho_townhouse',
  'menlo-park',
  'clear-lines-house',
  'paseo-olivos',
  'pleasanton-regency',
  'brookside-berkeley',
  'walnut-creek',
  'sunny-house-redwood-city',
];

function imageFromProject(project, index = 0) {
  const asset = (project.assets || []).filter((item) => item.kind === 'image' && item.status === 'active' && item.publicUrl)[index]
    || (project.assets || []).find((item) => item.kind === 'image' && item.status === 'active' && item.publicUrl);
  if (!asset) return '';
  return {
    url: asset.publicUrl,
    assetId: asset.id,
    projectId: project.id,
    alt: asset.altText || project.title,
  };
}

function findProject(projects, slug) {
  return projects.find((project) => project.slug === slug);
}

function pickImages(projects, slugs) {
  const usedProjectIds = new Set();
  const usedUrls = new Set();
  return slugs
    .map((slug, index) => {
      const project = findProject(projects, slug);
      if (!project || usedProjectIds.has(project.id)) return '';
      const image = imageFromProject(project, index % 2);
      if (!image || usedUrls.has(image.url)) return '';
      usedProjectIds.add(project.id);
      usedUrls.add(image.url);
      return image;
    })
    .filter(Boolean);
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
  body: JSON.stringify({ username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASSWORD || 'admin123' }),
});
const headers = {
  authorization: `Bearer ${login.token}`,
  'content-type': 'application/json',
};
const content = await request('/api/admin/content', { headers });
const settings = content.homepageSettings;
const kitchenImages = pickImages(content.projects, kitchenSlugs);
const approachImage = imageFromProject(findProject(content.projects, approachSlug) || {}, 0);
const bathroomImages = pickImages(content.projects, bathroomSlugs);
const usedHomeProjectIds = new Set([
  ...kitchenImages.map((image) => image.projectId),
  ...bathroomImages.map((image) => image.projectId),
  approachImage?.projectId,
].filter(Boolean));
const detailImages = pickImages(
  content.projects.filter((project) => !usedHomeProjectIds.has(project.id)),
  detailSlugs,
);

const nextSettings = {
  ...settings,
  collage: {
    ...settings.collage,
    title: 'Kitchens made to be used.',
    text: 'Different kitchen projects, real finished photos: storage, light, work surfaces, and the line where daily life happens.',
    quote: 'Real kitchens should look calm and work hard.',
    cardTitle: 'Live kitchen rhythm',
    cardText: 'No render mood here: just finished kitchens, natural light, and materials already doing their job.',
    images: {
      primary: kitchenImages[0] || settings.collage.images.primary,
      smallOne: kitchenImages[1] || settings.collage.images.smallOne,
      wide: kitchenImages[2] || settings.collage.images.wide,
      tall: kitchenImages[3] || settings.collage.images.tall,
      smallTwo: kitchenImages[4] || settings.collage.images.smallTwo,
    },
  },
  showcase: {
    ...settings.showcase,
    label: 'Bathrooms',
    title: 'Quiet bathrooms with real texture.',
    projectCount: 8,
  },
  approach: {
    ...settings.approach,
    label: 'Kitchen ideas',
    title: 'Bring the idea to the heat.',
    image: approachImage || settings.approach.image,
    items: [
      { number: '01', title: 'Work line', text: 'The path between sink, stove, storage, and table stays clear.' },
      { number: '02', title: 'Useful storage', text: 'Cabinetry is planned around real routines, not just symmetry.' },
      { number: '03', title: 'Natural light', text: 'Materials are chosen for how they look in the room every day.' },
    ],
  },
  detail: {
    ...settings.detail,
    label: 'Detail motion',
    title: 'Best live projects, one detail at a time.',
    images: detailImages.length ? detailImages : settings.detail.images,
  },
};

await request('/api/admin/homepage-settings', {
  method: 'PUT',
  headers,
  body: JSON.stringify(nextSettings),
});

console.log(JSON.stringify({
  updated: true,
  kitchenImages: kitchenImages.length,
  bathroomImages: bathroomImages.length,
  detailImages: detailImages.length,
}, null, 2));
