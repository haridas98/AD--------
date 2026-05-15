import type { PortfolioSectionKey } from './portfolioRoutes';

export type ServiceLandingKey =
  | 'kitchen-remodeling'
  | 'bathroom-remodeling'
  | 'full-house-remodeling'
  | 'adu-interiors'
  | 'fireplace-design';

export type ServiceLandingPage = {
  key: ServiceLandingKey;
  path: string;
  title: string;
  eyebrow: string;
  description: string;
  categoryKey: PortfolioSectionKey;
  keywords: string[];
  faq: Array<{ question: string; answer: string }>;
};

export const serviceLandingPages: ServiceLandingPage[] = [
  {
    key: 'kitchen-remodeling',
    path: '/services/kitchen-remodeling',
    title: 'Kitchen Remodeling Design in California',
    eyebrow: 'Kitchen design',
    description: 'Kitchen remodel design focused on layout, storage, materials, lighting, and finished California homes.',
    categoryKey: 'kitchens',
    keywords: ['kitchen remodeling California', 'kitchen designer California', 'custom kitchen design'],
    faq: [
      { question: 'What does a kitchen remodel designer prepare?', answer: 'Planning options, finish direction, cabinet logic, lighting notes, drawings, and construction support.' },
      { question: 'Can Alexandra work from existing home photos?', answer: 'Yes. Existing photos help define the layout issues, storage needs, light, and material direction.' },
    ],
  },
  {
    key: 'bathroom-remodeling',
    path: '/services/bathroom-remodeling',
    title: 'Bathroom Remodeling Design in California',
    eyebrow: 'Bathroom design',
    description: 'Bathroom remodel design with calm materials, practical storage, clear planning, and durable details.',
    categoryKey: 'bathroom',
    keywords: ['bathroom remodeling California', 'bathroom designer California', 'bathroom interior design'],
    faq: [
      { question: 'What matters most in a bathroom remodel?', answer: 'A clean layout, durable surfaces, ventilation, lighting, storage, and details that are easy to maintain.' },
      { question: 'Are small bathrooms supported?', answer: 'Yes. Compact bathrooms often benefit most from careful planning and edited materials.' },
    ],
  },
  {
    key: 'full-house-remodeling',
    path: '/services/full-house-remodeling',
    title: 'Full House Remodeling Design in California',
    eyebrow: 'Whole home design',
    description: 'Full house remodeling design for connected layouts, balanced materials, millwork, lighting, and finished home flow.',
    categoryKey: 'full-house',
    keywords: ['full house remodeling California', 'whole home interior designer', 'home remodel design'],
    faq: [
      { question: 'When should a designer join a full home remodel?', answer: 'Early. Planning before construction helps align layout, lighting, materials, cabinetry, and budget decisions.' },
      { question: 'Can one room be handled first?', answer: 'Yes. The work can start with one priority area while keeping the whole home direction consistent.' },
    ],
  },
  {
    key: 'adu-interiors',
    path: '/services/adu-interiors',
    title: 'ADU Interior Design in California',
    eyebrow: 'ADU design',
    description: 'ADU interior design for compact California homes, guest units, rental units, studios, and flexible family spaces.',
    categoryKey: 'adu',
    keywords: ['ADU interior design California', 'ADU designer California', 'small space interior design'],
    faq: [
      { question: 'What makes ADU interiors different?', answer: 'Every inch has to work harder: storage, light, furniture scale, privacy, and everyday maintenance matter more.' },
      { question: 'Can an ADU feel like a real home?', answer: 'Yes. Good planning, daylight, and simple materials help compact spaces feel complete.' },
    ],
  },
  {
    key: 'fireplace-design',
    path: '/services/fireplace-design',
    title: 'Fireplace Design in California',
    eyebrow: 'Fireplace design',
    description: 'Fireplace design and built-in planning for rooms that need a clear focal point, storage, texture, and warmth.',
    categoryKey: 'fireplaces',
    keywords: ['fireplace design California', 'fireplace remodel designer', 'built in fireplace design'],
    faq: [
      { question: 'Can a fireplace update change the room?', answer: 'Yes. A fireplace often sets the rhythm for shelves, seating, lighting, material texture, and the main wall.' },
      { question: 'Do fireplace projects include built-ins?', answer: 'They can. Built-ins, storage, display shelves, and media walls are often planned together.' },
    ],
  },
];

export const serviceLandingPaths = serviceLandingPages.map((page) => page.path);

export function getServiceLandingPage(key?: string) {
  return serviceLandingPages.find((page) => page.key === key);
}

export function slugifyLocation(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatCityWithState(cityName?: string | null) {
  const city = String(cityName || '').trim();
  if (!city) return 'California';
  return /\b(ca|california)\b/i.test(city) ? city : `${city}, CA`;
}
