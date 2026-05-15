const CATEGORY_LABELS = {
  kitchens: 'kitchen',
  bathrooms: 'bathroom',
  bathroom: 'bathroom',
  'full-house-remodeling': 'home remodel',
  'full-house': 'home remodel',
  adu1: 'ADU interior',
  adu: 'ADU interior',
  fireplaces: 'fireplace',
};

const CATEGORY_SEO_PHRASES = {
  kitchens: 'kitchen remodel design',
  bathrooms: 'bathroom remodel design',
  bathroom: 'bathroom remodel design',
  'full-house-remodeling': 'full house remodeling design',
  'full-house': 'full house remodeling design',
  adu1: 'ADU interior design',
  adu: 'ADU interior design',
  fireplaces: 'fireplace design',
};

const NEGATIVE_TERMS = [
  'render',
  '3d',
  'visual',
  'concept',
  'sketch',
  'drawing',
  'plan',
  'elevation',
  'before',
  'progress',
  'construction',
  'demo',
  'portrait',
  'people',
  'person',
  'client',
  'family',
  'logo',
  'screenshot',
  'whatsapp',
  'low res',
];

const POSITIVE_TERMS = [
  'finished',
  'final',
  'photo',
  'photos',
  'high res',
  'high-res',
  'no logo',
  'alexandradiz',
];

export function parseProjectContent(content) {
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content || '[]') : content;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getProjectCategoryKey(project) {
  return project?.category?.slug || project?.categoryId || '';
}

export function getProjectCategoryLabel(project) {
  const key = getProjectCategoryKey(project);
  return CATEGORY_LABELS[key] || String(project?.category?.name || 'interior').toLowerCase();
}

export function getProjectSeoPhrase(project) {
  const key = getProjectCategoryKey(project);
  return CATEGORY_SEO_PHRASES[key] || 'interior design';
}

export function getProjectNoun(project) {
  const label = getProjectCategoryLabel(project);
  const title = String(project?.title || '').toLowerCase();
  if (label === 'kitchen' && title.includes('kitchen')) return 'project';
  if (label === 'bathroom' && title.includes('bath')) return 'project';
  if (label === 'fireplace' && title.includes('fireplace')) return 'project';
  if (label === 'home remodel' && /\b(home|house)\b/.test(title)) return 'remodel project';
  if (label === 'ADU interior' && /\badu\b/i.test(title)) return 'project';
  return `${label} project`;
}

export function scoreProjectImageAsset(asset) {
  const width = Number(asset?.width || 0);
  const height = Number(asset?.height || 0);
  const ratio = width && height ? width / height : 0;
  const megapixels = width && height ? (width * height) / 1_000_000 : 0;
  const haystack = `${asset?.originalFilename || ''} ${asset?.sourcePath || ''} ${asset?.publicUrl || ''}`.toLowerCase();
  let score = 1000;

  if (asset?.sourceType === 'legacy-import' || asset?.sourceType === 'folder-sync') score += 80;
  if (ratio >= 1.15 && ratio <= 1.9) score += 240;
  else if (ratio >= 1.0 && ratio < 1.15) score += 120;
  else if (ratio >= 0.75 && ratio < 1.0) score -= 60;
  else if (ratio > 2.35 || (ratio > 0 && ratio < 0.75)) score -= 180;

  score += Math.min(180, Math.round(megapixels * 28));
  score += Math.min(80, Math.round(Number(asset?.fileSize || 0) / 180000));

  for (const term of POSITIVE_TERMS) {
    if (haystack.includes(term)) score += 35;
  }
  for (const term of NEGATIVE_TERMS) {
    if (haystack.includes(term)) score -= 180;
  }

  return score;
}

export function sortProjectImageAssets(assets = []) {
  return [...assets]
    .filter((asset) => asset?.kind === 'image' && asset?.status === 'active' && asset?.publicUrl)
    .sort((a, b) => {
      const scoreDiff = scoreProjectImageAsset(b) - scoreProjectImageAsset(a);
      if (scoreDiff !== 0) return scoreDiff;
      const areaDiff = Number(b.width || 0) * Number(b.height || 0) - Number(a.width || 0) * Number(a.height || 0);
      if (areaDiff !== 0) return areaDiff;
      return String(a.originalFilename || '').localeCompare(String(b.originalFilename || ''));
    });
}

export function buildProjectAssetSeo(project, asset, index = 0) {
  const noun = getProjectNoun(project);
  const location = project?.cityName ? ` in ${project.cityName}` : '';
  const suffix = index > 0 ? `, view ${index + 1}` : '';
  return {
    altText: `${project?.title || 'Project'} ${noun}${location}${suffix} by Alexandra Diz`,
    caption: `Finished ${noun} photo${location}, ${project?.title || 'Project'}, view ${index + 1}.`,
  };
}

export function buildProjectSeoMetadata(project) {
  const phrase = getProjectSeoPhrase(project);
  const location = project?.cityName || 'California';
  const title = project?.title || 'Project';
  return {
    seoTitle: `${title} | ${phrase} in ${location} | Alexandra Diz`.slice(0, 80),
    seoDescription: `${title} is a ${phrase} project in ${location} by Alexandra Diz, shown with finished interior photos, materials, layout, and details.`.slice(0, 180),
    seoKeywords: [title, `${phrase} ${location}`, 'Alexandra Diz', 'California interior designer', 'finished interior photos'].join(', '),
  };
}

function getUrl(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value.url || value.image || '';
  return '';
}

function getGeneratedSeoForUrl(url, assetByUrl, orderByUrl, project, seoByAssetId) {
  if (!url) return null;
  const asset = assetByUrl.get(url);
  if (!asset) return null;
  return {
    asset,
    generated: seoByAssetId.get(asset.id) || buildProjectAssetSeo(project, asset, orderByUrl.get(url) || 0),
  };
}

function updateStructuredImageValue(value, assetByUrl, orderByUrl, project, seoByAssetId) {
  const url = getUrl(value);
  const match = getGeneratedSeoForUrl(url, assetByUrl, orderByUrl, project, seoByAssetId);
  if (!match) return value;
  if (typeof value === 'string') return { url, alt: match.generated.altText, assetId: match.asset.id };
  return { ...value, url, alt: match.generated.altText, assetId: value.assetId || match.asset.id };
}

function updateScalarImageFields(data, imageKey, altKey, assetIdKey, assetByUrl, orderByUrl, project, seoByAssetId) {
  const url = getUrl(data[imageKey]);
  const match = getGeneratedSeoForUrl(url, assetByUrl, orderByUrl, project, seoByAssetId);
  if (!match) return;
  data[imageKey] = url;
  data[altKey] = match.generated.altText;
  if (assetIdKey) data[assetIdKey] = match.asset.id;
}

function sortImageArray(images, assetByUrl, orderByUrl, project, seoByAssetId) {
  const seen = new Set();
  return images
    .map((image, index) => ({ image: updateStructuredImageValue(image, assetByUrl, orderByUrl, project, seoByAssetId), index }))
    .filter(({ image }) => {
      const url = getUrl(image);
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    })
    .sort((a, b) => {
      const aOrder = orderByUrl.get(getUrl(a.image));
      const bOrder = orderByUrl.get(getUrl(b.image));
      if (aOrder == null && bOrder == null) return a.index - b.index;
      if (aOrder == null) return 1;
      if (bOrder == null) return -1;
      return aOrder - bOrder;
    })
    .map(({ image }) => image);
}

export function updateProjectContentImageSeo({ project, content, orderedAssets, seoByAssetId, replaceHero = true }) {
  const assetByUrl = new Map(orderedAssets.map((asset) => [asset.publicUrl, asset]));
  const orderByUrl = new Map(orderedAssets.map((asset, index) => [asset.publicUrl, index]));
  const bestAsset = orderedAssets[0];

  return parseProjectContent(content).map((block) => {
    const data = { ...(block.data || {}) };

    if (block.type === 'heroImage' && replaceHero && bestAsset) {
      const generated = seoByAssetId.get(bestAsset.id) || buildProjectAssetSeo(project, bestAsset, 0);
      data.image = bestAsset.publicUrl;
      data.alt = generated.altText;
      data.assetId = bestAsset.id;
      return { ...block, data };
    }

    if (Array.isArray(data.images)) data.images = sortImageArray(data.images, assetByUrl, orderByUrl, project, seoByAssetId);
    if (block.type === 'sideBySide' || block.type === 'editorialNote') {
      updateScalarImageFields(data, 'image', 'alt', 'assetId', assetByUrl, orderByUrl, project, seoByAssetId);
    }
    if (block.type === 'beforeAfter') {
      updateScalarImageFields(data, 'beforeImage', 'beforeAlt', 'beforeAssetId', assetByUrl, orderByUrl, project, seoByAssetId);
      updateScalarImageFields(data, 'afterImage', 'afterAlt', 'afterAssetId', assetByUrl, orderByUrl, project, seoByAssetId);
    }

    if (Array.isArray(data.items)) {
      data.items = data.items.map((item) => {
        if (!item || typeof item !== 'object') return item;
        const next = { ...item };
        if (block.type === 'circleDetail') {
          updateScalarImageFields(next, 'image', 'alt', 'assetId', assetByUrl, orderByUrl, project, seoByAssetId);
        }
        if (Array.isArray(next.images)) {
          next.images = next.images.map((image) => updateStructuredImageValue(image, assetByUrl, orderByUrl, project, seoByAssetId));
        }
        return next;
      });
    }

    return { ...block, data };
  });
}

export function collectProjectAssetUsages(project, blocks, orderedAssets) {
  const assetByUrl = new Map(orderedAssets.map((asset) => [asset.publicUrl, asset]));
  const usages = [];
  const now = new Date().toISOString();

  function walk(value, pathParts, block) {
    const url = getUrl(value);
    if (url && assetByUrl.has(url)) {
      const asset = assetByUrl.get(url);
      usages.push({
        projectId: project.id,
        assetId: asset.id,
        blockId: block.id || null,
        slotKey: pathParts.join('.').slice(0, 180),
        usageType: block.type || null,
        sortOrder: usages.length,
        createdAt: now,
        updatedAt: now,
      });
      if (value && typeof value === 'object' && !Array.isArray(value) && ('url' in value || 'image' in value)) return;
    }

    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, [...pathParts, String(index)], block));
      return;
    }
    Object.entries(value).forEach(([key, item]) => walk(item, [...pathParts, key], block));
  }

  blocks.forEach((block, blockIndex) => walk(block.data || {}, [`block:${blockIndex}`], block));
  const seen = new Set();
  return usages.filter((usage) => {
    const key = `${usage.assetId}:${usage.blockId}:${usage.slotKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
