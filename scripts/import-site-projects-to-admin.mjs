import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.ADMIN_BASE_URL || 'http://127.0.0.1:8787';
const MANIFEST_PATH = process.env.SITE_PROJECTS_MANIFEST || 'E:/AD/_site_projects/site-projects-manifest.json';
const USERNAME = process.env.ADMIN_USER || 'admin';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const APPLY = process.argv.includes('--apply');
const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice('--only='.length).trim() : '';

const manualProjectMatches = {
  bahl: '22333-bahl-cupertino',
  belmont: 'belmond',
  'brookside-berkeley': '150-brookside-berkley',
  glasgow: '113-glasgow-ln-san-carlos-ca-94070',
  teredo: '636-teredo-dr-redwood-city-ca-94065',
};

const categoryByProjectSlug = {
  'rita-bathrooms': 'bathrooms',
  belmont: 'kitchens',
  'paseo-olivos': 'full-house-remodeling',
  'pleasanton-foothill': 'full-house-remodeling',
};

function slug(value) {
  return String(value || 'project')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-') || 'project';
}

function inferCategory(project, existingProject) {
  if (existingProject?.categoryId) return existingProject.categoryId;
  if (categoryByProjectSlug[project.projectSlug]) return categoryByProjectSlug[project.projectSlug];
  if (/bath|shower|tub/i.test(project.projectName)) return 'bathrooms';
  if (/kitchen|belmont/i.test(project.projectName)) return 'kitchens';
  return 'full-house-remodeling';
}

function seoFor(project) {
  const city = project.city ? `, ${project.city}` : '';
  return {
    seoTitle: `${project.projectName}${city} | Alexandra Diz`,
    seoDescription: `${project.projectName}${city}: finished residential interior design project with real photography by Alexandra Diz.`,
    seoKeywords: [project.projectName, project.city, 'Alexandra Diz', 'interior design', 'remodeling'].filter(Boolean).join(', '),
  };
}

function buildContent(project, assets) {
  const images = assets.map((asset, index) => ({
    url: asset.publicUrl,
    alt: asset.altText || `${project.projectName} image ${index + 1}`,
    assetId: asset.id,
  }));
  const hero = images[0];
  return [
    {
      id: 'live-photo-hero',
      type: 'heroImage',
      data: {
        title: project.projectName,
        subtitle: project.city ? `Finished home photography from ${project.city}.` : 'Finished home photography.',
        image: hero?.url || '',
        alt: hero?.alt || project.projectName,
      },
    },
    {
      id: 'live-photo-overview',
      type: 'typography',
      data: {
        title: 'Project overview',
        content: `${project.projectName} is shown through real completed-space photography, with emphasis on light, materials, planning, and daily function.`,
        size: 'md',
      },
    },
    {
      id: 'live-photo-grid',
      type: 'imageGrid',
      data: {
        columns: 2,
        images,
      },
    },
    {
      id: 'live-photo-slider',
      type: 'refinedSlider',
      data: {
        title: 'Project photos',
        description: 'Selected live photographs from the finished project.',
        thumbnailPosition: 'bottom',
        images,
      },
    },
  ];
}

async function request(pathname, options = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${options.method || 'GET'} ${pathname} failed ${response.status}: ${text}`);
  }
  return response.json();
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const headers = {
    authorization: `Bearer ${login.token}`,
  };
  const jsonHeaders = {
    ...headers,
    'content-type': 'application/json',
  };

  let content = await request('/api/admin/content', { headers });
  const bySlug = new Map(content.projects.map((project) => [String(project.slug || '').toLowerCase(), project]));
  const byTitleSlug = new Map(content.projects.map((project) => [slug(project.title), project]));
  const actions = [];

  for (const project of manifest.projects) {
    if (ONLY && project.projectSlug !== ONLY && project.projectName !== ONLY) continue;
    const existingSlug = manualProjectMatches[project.projectSlug] || project.matchedAdminProject?.slug || project.projectSlug;
    const existing = bySlug.get(String(existingSlug).toLowerCase()) || bySlug.get(project.projectSlug) || byTitleSlug.get(slug(project.projectName));
    const categoryId = inferCategory(project, existing);
    const seo = seoFor(project);
    const nextProjectSlug = project.projectSlug;
    const projectPayload = {
      title: project.projectName,
      slug: existing ? existing.slug : nextProjectSlug,
      categoryId,
      isFeatured: existing?.isFeatured || false,
      isPublished: true,
      stylePreset: existing?.stylePreset || 'default',
      sortOrder: existing?.sortOrder || 0,
      cityName: project.city || existing?.cityName || '',
      year: existing?.year || '',
      completedAt: existing?.completedAt || '',
      deletedAt: '',
      content: JSON.stringify(existing?.content || []),
      ...seo,
    };

    actions.push(`${existing ? 'update' : 'create'} ${project.projectName} (${project.projectSlug}) images=${project.images.length}`);
    if (!APPLY) continue;

    let savedProject = existing;
    if (existing) {
      savedProject = await request(`/api/admin/projects/${existing.id}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify(projectPayload),
      });
    } else {
      savedProject = await request('/api/admin/projects', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(projectPayload),
      });
      bySlug.set(String(savedProject.slug).toLowerCase(), savedProject);
    }

    const assetResponse = await request(`/api/admin/projects/${savedProject.id}/assets`, { headers });
    for (const asset of assetResponse.assets || []) {
      if (asset.status === 'active') {
        await request(`/api/admin/projects/${savedProject.id}/assets/${asset.id}`, {
          method: 'DELETE',
          headers,
        });
      }
    }

    const uploadedAssets = [];
    for (const image of project.images) {
      const filePath = path.join(path.dirname(MANIFEST_PATH), image.file);
      const buffer = fs.readFileSync(filePath);
      const form = new FormData();
      form.append('asset', new Blob([buffer], { type: 'image/jpeg' }), path.basename(filePath));
      const uploaded = await request(`/api/admin/projects/${savedProject.id}/assets/upload`, {
        method: 'POST',
        headers,
        body: form,
      });
      if (uploaded.asset) uploadedAssets.push(uploaded.asset);
    }

    const contentPayload = {
      ...projectPayload,
      content: JSON.stringify(buildContent(project, uploadedAssets)),
    };
    await request(`/api/admin/projects/${savedProject.id}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(contentPayload),
    });

    console.log(`[imported] ${project.projectName}: ${uploadedAssets.length} images`);
  }

  console.log(JSON.stringify({
    mode: APPLY ? 'APPLY' : 'DRY_RUN',
    projectCount: manifest.projects.length,
    actions,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
