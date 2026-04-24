export type PortfolioSectionKey =
  | 'kitchens'
  | 'full-house'
  | 'bathroom'
  | 'adu'
  | 'fireplaces';

type PortfolioSectionDefinition = {
  key: PortfolioSectionKey;
  label: string;
  legacySlug: string;
  canonicalSlug: string;
};

type PortfolioSection = PortfolioSectionDefinition & {
  canonicalCategoryPath: string;
  canonicalProjectPathPattern: string;
  legacyCategoryPath: string;
  legacyProjectPathPattern: string;
};

type CategoryLike = {
  id?: string;
  slug?: string;
};

export const PORTFOLIO_ROOT_PATH = '/projects';

const portfolioSectionsBase: PortfolioSectionDefinition[] = [
  { key: 'kitchens', label: 'Kitchens', legacySlug: 'kitchens', canonicalSlug: 'kitchens' },
  { key: 'full-house', label: 'Full House', legacySlug: 'full-house-remodeling', canonicalSlug: 'full-house' },
  { key: 'bathroom', label: 'Bathroom', legacySlug: 'bathrooms', canonicalSlug: 'bathroom' },
  { key: 'adu', label: 'ADU', legacySlug: 'adu1', canonicalSlug: 'adu' },
  { key: 'fireplaces', label: 'Fireplaces', legacySlug: 'fireplaces', canonicalSlug: 'fireplaces' },
];

export const portfolioSections: PortfolioSection[] = portfolioSectionsBase.map((section) => ({
  ...section,
  canonicalCategoryPath: `${PORTFOLIO_ROOT_PATH}/${section.canonicalSlug}`,
  canonicalProjectPathPattern: `${PORTFOLIO_ROOT_PATH}/${section.canonicalSlug}/:slug`,
  legacyCategoryPath: `/${section.legacySlug}`,
  legacyProjectPathPattern: `/${section.legacySlug}/:slug`,
}));

export const portfolioSectionMap = Object.fromEntries(
  portfolioSections.map((section) => [section.key, section]),
) as Record<PortfolioSectionKey, PortfolioSection>;

export function getPortfolioSectionByCanonicalSlug(slug?: string) {
  return portfolioSections.find((section) => section.canonicalSlug === slug);
}

export function getCanonicalPortfolioProjectPath(key: PortfolioSectionKey, slug: string) {
  return `${portfolioSectionMap[key].canonicalCategoryPath}/${slug}`;
}

export function getLegacyPortfolioProjectPath(key: PortfolioSectionKey, slug: string) {
  return `${portfolioSectionMap[key].legacyCategoryPath}/${slug}`;
}

export const portfolioHeaderItems = portfolioSections.map((section) => ({
  name: section.label,
  href: section.canonicalCategoryPath,
}));

export function getPortfolioSectionByLegacySlug(slug?: string) {
  return portfolioSections.find((section) => section.legacySlug === slug);
}

export function getPortfolioSectionByCategoryIdentifier(identifier?: string) {
  if (!identifier) return undefined;

  return portfolioSections.find(
    (section) =>
      section.key === identifier ||
      section.legacySlug === identifier ||
      section.canonicalSlug === identifier,
  );
}

export function getPortfolioSectionForCategory(category?: CategoryLike | null) {
  if (!category) return undefined;

  return (
    getPortfolioSectionByCategoryIdentifier(category.slug) ||
    getPortfolioSectionByCategoryIdentifier(category.id)
  );
}

export function getCanonicalPortfolioCategoryPath(categoryIdentifier?: string) {
  const section = getPortfolioSectionByCategoryIdentifier(categoryIdentifier);
  return section?.canonicalCategoryPath || PORTFOLIO_ROOT_PATH;
}

export function getCanonicalPortfolioProjectPathByCategory(categoryIdentifier: string, slug: string) {
  return `${getCanonicalPortfolioCategoryPath(categoryIdentifier)}/${slug}`;
}

export function getCanonicalPortfolioCategoryPathForCategory(category?: CategoryLike | null) {
  return getPortfolioSectionForCategory(category)?.canonicalCategoryPath || PORTFOLIO_ROOT_PATH;
}

export function getCanonicalPortfolioProjectPathForCategory(category: CategoryLike | null | undefined, slug: string) {
  return `${getCanonicalPortfolioCategoryPathForCategory(category)}/${slug}`;
}

export function getProjectCountForSection(
  sectionKey: PortfolioSectionKey,
  categories: CategoryLike[],
  projects: Array<{ categoryId: string; isPublished?: boolean }>,
) {
  const section = portfolioSectionMap[sectionKey];
  const matchingCategoryIds = new Set(
    categories
      .filter((category) =>
        category.slug === section.legacySlug ||
        category.slug === section.canonicalSlug ||
        category.id === section.legacySlug ||
        category.id === section.canonicalSlug,
      )
      .map((category) => category.id)
      .filter(Boolean),
  );

  return projects.filter((project) => {
    if (project.isPublished === false) return false;

    return (
      matchingCategoryIds.has(project.categoryId) ||
      project.categoryId === section.legacySlug ||
      project.categoryId === section.canonicalSlug
    );
  }).length;
}

export function resolvePortfolioSectionFromPathname(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);

  if (!segments.length) return undefined;

  if (segments[0] === PORTFOLIO_ROOT_PATH.replace('/', '')) {
    return getPortfolioSectionByCanonicalSlug(segments[1]);
  }

  return getPortfolioSectionByLegacySlug(segments[0]);
}
