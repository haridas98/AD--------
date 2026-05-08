const SITE_URL = 'https://alexandradiz.com';

export function absoluteUrl(pathname = '/') {
  if (/^https?:\/\//i.test(pathname)) return pathname;
  return `${SITE_URL}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

export function imageUrl(url?: string | null) {
  if (!url) return undefined;
  return absoluteUrl(url);
}

export function localBusinessSchema(siteName = 'Alexandra Diz Architecture') {
  return {
    '@context': 'https://schema.org',
    '@type': 'InteriorDesignService',
    '@id': `${SITE_URL}/#business`,
    name: siteName,
    url: SITE_URL,
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

export function serviceSchema(name: string, description: string, pathname: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: { '@id': `${SITE_URL}/#business` },
    areaServed: 'California',
    url: absoluteUrl(pathname),
  };
}
