const SITE_URL = 'https://alexandradiz.com';
const DEFAULT_SOCIAL_PROFILES = [
  'https://www.instagram.com/alexandradiz/',
  'https://www.facebook.com/dizarts/',
  'https://www.houzz.com/pro/alexandra-diz/alexandra-diz-architecture',
  'https://www.pinterest.com/alexandradiz',
  'https://www.youtube.com/@alexandradizsiliconvalleyd5188',
];

export function absoluteUrl(pathname = '/') {
  if (/^https?:\/\//i.test(pathname)) return pathname;
  return `${SITE_URL}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

export function imageUrl(url?: string | { url?: string; image?: string } | null) {
  const value = typeof url === 'string' ? url : url?.url || url?.image || '';
  if (!value) return undefined;
  return absoluteUrl(value);
}

export function localBusinessSchema(siteName = 'Alexandra Diz Architecture', sameAs = DEFAULT_SOCIAL_PROFILES) {
  return {
    '@context': 'https://schema.org',
    '@type': 'InteriorDesignService',
    '@id': `${SITE_URL}/#business`,
    name: siteName,
    url: SITE_URL,
    sameAs,
    areaServed: [
      'San Jose, CA',
      'Los Altos, CA',
      'Palo Alto, CA',
      'Saratoga, CA',
      'Menlo Park, CA',
      'San Carlos, CA',
      'Redwood City, CA',
      'California',
    ],
    serviceType: [
      'Interior design',
      'Kitchen remodel design',
      'Bathroom remodel design',
      'Full home remodeling design',
      'ADU interior design',
    ],
  };
}

export function serviceSchema(name: string, description: string, pathname: string, areaServed = 'California') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: { '@id': `${SITE_URL}/#business` },
    areaServed,
    url: absoluteUrl(pathname),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function faqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function projectSchema(input: {
  title: string;
  description: string;
  pathname: string;
  image?: string;
  category?: string;
  cityName?: string | null;
  year?: string | number | null;
  siteName?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.pathname),
    image: imageUrl(input.image),
    about: input.category,
    spatialCoverage: input.cityName,
    dateCreated: input.year ? String(input.year) : undefined,
    author: { '@type': 'Organization', name: input.siteName || 'Alexandra Diz Architecture' },
  };
}
