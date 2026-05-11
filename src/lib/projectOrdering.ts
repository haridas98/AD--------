import type { Project } from '../types';

const liveProjectPrioritySlugs = [
  'walnut-creek',
  'fremont',
  'menlo-park',
  'menlopark',
  'saratoga',
  'california-ocean-house-in-paccifica',
  'cozy-home-in-menlo-park-ca',
  'los-altos',
  'sunny-house-redwood-city',
  'modern-kitchen-in-sunnyvale',
  'pure-elegance-kitchen',
  'oakland',
  'warm-kitchen-oakland',
  'bright-mood-pacifica',
  'belmond',
  'foster-city',
  'lightness-of-wood-san-jose',
  'los-gatos',
  'oakland-5073',
  'palo-alto-800',
  'relax-oasis',
  'san-bruno',
  'shades-of-blue-pacifica',
  'stil-mountin-view',
  'hull',
];

const liveProjectPriority = new Map(liveProjectPrioritySlugs.map((slug, index) => [slug.toLowerCase(), index]));

function extractYear(value?: string | number | null) {
  if (value == null) return 0;
  const match = String(value).match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : 0;
}

export function getProjectDateWeight(project: Pick<Project, 'completedAt' | 'year' | 'updatedAt' | 'createdAt'>) {
  const realizedYear = extractYear(project.completedAt) || extractYear(project.year);
  if (realizedYear) return realizedYear * 100000000000;

  const updated = project.updatedAt ? Date.parse(project.updatedAt) : 0;
  const created = project.createdAt ? Date.parse(project.createdAt) : 0;
  return updated || created || 0;
}

export function getProjectImageCount(project: Pick<Project, 'assets' | 'content'>) {
  const assetCount = (project.assets || []).filter((asset) => asset.kind === 'image' && asset.status === 'active').length;
  if (assetCount) return assetCount;

  try {
    const blocks = typeof project.content === 'string' ? JSON.parse(project.content || '[]') : project.content;
    const images = new Set<string>();

    const collect = (value: unknown) => {
      if (!value) return;
      if (typeof value === 'string') {
        if (/\/uploads\/|\/images\/|https?:\/\//i.test(value)) images.add(value);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(collect);
        return;
      }
      if (typeof value === 'object') Object.values(value).forEach(collect);
    };

    collect(blocks);
    return images.size;
  } catch {
    return 0;
  }
}

export function getLiveProjectRank(project: Pick<Project, 'slug'>) {
  return liveProjectPriority.get(project.slug.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
}

export function isLivePriorityProject(project: Pick<Project, 'slug'>) {
  return getLiveProjectRank(project) !== Number.MAX_SAFE_INTEGER;
}

export function sortProjectsForPortfolio<T extends Project>(projects: T[]) {
  return [...projects].sort((a, b) => {
    const liveDiff = Number(isLivePriorityProject(b)) - Number(isLivePriorityProject(a));
    if (liveDiff !== 0) return liveDiff;

    if (isLivePriorityProject(a) && isLivePriorityProject(b)) {
      const rankDiff = getLiveProjectRank(a) - getLiveProjectRank(b);
      if (rankDiff !== 0) return rankDiff;
    }

    const imageDiff = getProjectImageCount(b) - getProjectImageCount(a);
    if (imageDiff !== 0) return imageDiff;

    if (a.isFeatured !== b.isFeatured) return Number(b.isFeatured) - Number(a.isFeatured);

    const dateDiff = getProjectDateWeight(b) - getProjectDateWeight(a);
    if (dateDiff !== 0) return dateDiff;

    return a.title.localeCompare(b.title);
  });
}

export function getProjectDisplayYear(project: Pick<Project, 'completedAt' | 'year' | 'updatedAt' | 'createdAt'>) {
  return extractYear(project.completedAt) || extractYear(project.year) || extractYear(project.updatedAt) || extractYear(project.createdAt);
}
