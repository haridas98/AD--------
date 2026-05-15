import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('data');
const HOMEPAGE_SETTINGS_PATH = path.join(DATA_DIR, 'homepage-settings.json');
const HOMEPAGE_SETTINGS_KEY = 'homepage';

export const DEFAULT_TESTIMONIALS = [
  {
    date: 'April, 2020',
    text: 'A few months ago, in 2019, I was about to renovate the interior of my apartment, when many of my friends recommended Alexandra to me. I am infinitely glad that I turned to her professional services. Alexandra is an incredibly talented designer, full of wonderful ideas and a delicate taste.',
    author: 'Irina Antonova',
    link: '@Houzz',
    linkHref: 'https://www.houzz.com/professionals/interior-designers-and-decorators/alexandra-diz-architecture-pfvwus-pf~562048119?',
    image: '/images/legacy/testimonial-erika.jpg',
    projectHref: '#',
    projectText: '',
  },
  {
    date: 'April, 2020',
    text: "I am extremely satisfied with Alexandra's job. She had great ideas, very professional attitude and sweet personality. I would never be able to remodel those two bathrooms on my own.",
    author: 'Rita Roysental',
    link: '@Houzz',
    linkHref: 'https://www.houzz.com/professionals/interior-designers-and-decorators/alexandra-diz-architecture-pfvwus-pf~562048119?',
    image: '',
    projectHref: '',
    projectText: '',
  },
  {
    date: 'June 26, 2019',
    text: 'Hiring Alexandra was the best decision we made when decorating our new home. She is a pleasure to work with, has great taste, is highly organized and her attention to detail is most impressive.',
    author: 'Sergey Stelmakh',
    link: '@linkedin',
    linkHref: 'https://www.linkedin.com/in/alexandradiz',
    image: '/images/legacy/testimonial-sergey.jpg',
    projectHref: 'http://alexandradiz.com/california-ocean-house-in-paccifica',
    projectText: 'Press to see the project',
  },
  {
    date: 'May 8, 2019',
    text: 'Alexandra came up with multiple creative ideas we did not even think were possible. She provided detailed sketches extremely fast, was always open for iterations, and her patience was endless.',
    author: 'Homeowner, Pacifica',
    link: '@Houzz',
    linkHref: 'https://www.houzz.com/professionals/interior-designers-and-decorators/alexandra-diz-architecture-pfvwus-pf~562048119?',
    image: '',
    projectHref: '',
    projectText: '',
  },
  {
    date: '2019',
    text: 'Alexandra transformed our home beyond what we imagined possible. Her eye for detail, creative use of space, and ability to understand exactly what we wanted made the entire process smooth and enjoyable.',
    author: 'Client, Los Altos',
    link: '',
    linkHref: '',
    image: '',
    projectHref: '',
    projectText: '',
  },
  {
    date: '2020',
    text: 'Working with Alexandra was an incredible experience from start to finish. She listened to our needs, presented creative solutions we had not considered, and managed every detail of the project flawlessly.',
    author: 'Homeowner, Redwood City',
    link: '',
    linkHref: '',
    image: '',
    projectHref: '',
    projectText: '',
  },
  {
    date: '2021',
    text: 'Alexandra helped us turn a fragmented floor plan into a home that finally feels calm and connected. Every room now has a clear purpose, and the materials feel refined without being too formal.',
    author: 'Private Client, San Carlos',
    link: '',
    linkHref: '',
    image: '',
    projectHref: '',
    projectText: '',
  },
  {
    date: '2021',
    text: 'We came to Alexandra with too many ideas and no clear direction. She narrowed the choices, protected the budget, and gave the house a finished look that still feels like us.',
    author: 'Homeowner, Palo Alto',
    link: '',
    linkHref: '',
    image: '',
    projectHref: '',
    projectText: '',
  },
  {
    date: '2022',
    text: 'The best part of working with Alexandra was how practical the process felt. The drawings, finishes and site conversations were precise, and the final rooms feel effortless.',
    author: 'Client, Saratoga',
    link: '',
    linkHref: '',
    image: '',
    projectHref: '',
    projectText: '',
  },
  {
    date: '2023',
    text: 'Alexandra understood the balance we wanted: warm, modern and not overdecorated. She found storage where we did not think it could exist and made the renovation feel organized.',
    author: 'Homeowner, San Jose',
    link: '',
    linkHref: '',
    image: '',
    projectHref: '',
    projectText: '',
  },
];

export const DEFAULT_HOMEPAGE_SETTINGS = {
  seo: {
    title: 'Interior Designer in California | Kitchens, Bathrooms & Remodels | Alexandra Diz',
    description: 'Alexandra Diz designs refined California homes: kitchen remodels, bathroom remodels, ADUs, and full house interiors with real finished project photography.',
    keywords: 'California interior designer, kitchen remodeling, bathroom remodeling, ADU interiors, Alexandra Diz',
  },
  hero: {
    title: 'Interiors that feel quietly extraordinary.',
    image: '/home/alexandra-hero-editorial.jpg',
  },
  collage: {
    title: 'Real homes, finished beautifully.',
    text: 'A selection of completed interiors with live photography: clean rooms, natural light, quiet materials, and no staged portraits.',
    quote: 'The best projects do not need a render to feel convincing.',
    cardTitle: 'Live atmosphere',
    cardText: 'Finished spaces, real light, and details that already work in daily life.',
    images: {
      primary: '',
      smallOne: '',
      wide: '',
      tall: '',
      smallTwo: '',
    },
  },
  feature: {
    quote: '"Homes become beautiful when every practical decision has a visual reason."',
    image: '/home/alexandra-studio-editorial.jpg',
    darkTitle: 'Rooms with a quieter rhythm',
    darkText: 'Plans, millwork and finishes are edited until the home feels composed, useful and personal.',
    linkLabel: 'Read more',
    linkHref: '/about',
    lightTitle: 'With Alexandra',
    lightText: 'From a single room consultation to full remodel planning, the work stays focused on clarity.',
  },
  showcase: {
    label: 'Kitchens',
    title: 'Bring ideas to the fire.',
    projectCount: 8,
  },
  approach: {
    label: 'Design reading',
    title: 'Before color, Alexandra reads the room.',
    image: '',
    items: [
      {
        number: '01',
        title: 'Sightlines',
        text: 'What should open, what should stay hidden, and where the eye lands first.',
      },
      {
        number: '02',
        title: 'Daily route',
        text: 'Storage, counters and lighting are placed around how the family actually moves.',
      },
      {
        number: '03',
        title: 'Quiet finish',
        text: 'Materials are edited until the home feels finished, not decorated.',
      },
    ],
  },
  detail: {
    label: 'Bathrooms',
    title: 'Quiet details, refined atmosphere.',
    images: [],
  },
  testimonials: {
    label: 'Client words',
    title: 'Reviews from homes that moved from idea to finished space.',
    count: 10,
    items: [],
  },
  cta: {
    label: 'Start a project',
    title: 'Bring the home into focus before the renovation begins.',
    buttonLabel: 'Book a conversation',
    buttonHref: '/contact',
  },
};

function cleanText(value, fallback = '', maxLength = 1200) {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, maxLength);
}

function cleanUrl(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const next = value.trim().slice(0, 600);
  if (!next) return '';
  if (/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(next)) return next;
  return fallback;
}

function cleanImageValue(value, fallback = '') {
  if (typeof value === 'string') return cleanUrl(value, fallback);
  if (!value || typeof value !== 'object') return fallback;

  const url = cleanUrl(value.url || '', '');
  if (!url) return fallback;

  return {
    url,
    assetId: cleanText(value.assetId || '', '', 120),
    projectId: cleanText(value.projectId || '', '', 120),
    alt: cleanText(value.alt || '', '', 180),
  };
}

function cleanCount(value, fallback, min, max) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, Math.round(next)));
}

function normalizeImageSet(input = {}) {
  const fallback = DEFAULT_HOMEPAGE_SETTINGS.collage.images;
  return {
    primary: cleanImageValue(input.primary, fallback.primary),
    smallOne: cleanImageValue(input.smallOne, fallback.smallOne),
    wide: cleanImageValue(input.wide, fallback.wide),
    tall: cleanImageValue(input.tall, fallback.tall),
    smallTwo: cleanImageValue(input.smallTwo, fallback.smallTwo),
  };
}

function normalizeApproachItems(input) {
  const source = Array.isArray(input) && input.length ? input : DEFAULT_HOMEPAGE_SETTINGS.approach.items;
  return source.slice(0, 6).map((item, index) => ({
    number: cleanText(item?.number, String(index + 1).padStart(2, '0'), 8),
    title: cleanText(item?.title, DEFAULT_HOMEPAGE_SETTINGS.approach.items[index]?.title || '', 120),
    text: cleanText(item?.text, DEFAULT_HOMEPAGE_SETTINGS.approach.items[index]?.text || '', 400),
  }));
}

function normalizeTestimonials(input) {
  const source = Array.isArray(input) && input.length ? input : [];
  return source.slice(0, 20).map((item, index) => ({
    date: cleanText(item?.date, '', 80),
    text: cleanText(item?.text, '', 900),
    author: cleanText(item?.author, 'Client', 120),
    link: cleanText(item?.link || '', '', 80),
    linkHref: cleanUrl(item?.linkHref || '', ''),
    image: cleanUrl(item?.image || '', ''),
    projectHref: cleanUrl(item?.projectHref || '', ''),
    projectText: cleanText(item?.projectText || '', '', 120),
  }));
}

export function normalizeHomepageSettings(input = {}) {
  const next = input || {};
  return {
    seo: {
      title: cleanText(next.seo?.title, DEFAULT_HOMEPAGE_SETTINGS.seo.title, 80),
      description: cleanText(next.seo?.description, DEFAULT_HOMEPAGE_SETTINGS.seo.description, 180),
      keywords: cleanText(next.seo?.keywords, DEFAULT_HOMEPAGE_SETTINGS.seo.keywords, 300),
    },
    hero: {
      title: cleanText(next.hero?.title, DEFAULT_HOMEPAGE_SETTINGS.hero.title, 160),
      image: cleanUrl(next.hero?.image, DEFAULT_HOMEPAGE_SETTINGS.hero.image),
    },
    collage: {
      title: cleanText(next.collage?.title, DEFAULT_HOMEPAGE_SETTINGS.collage.title, 180),
      text: cleanText(next.collage?.text, DEFAULT_HOMEPAGE_SETTINGS.collage.text, 600),
      quote: cleanText(next.collage?.quote, DEFAULT_HOMEPAGE_SETTINGS.collage.quote, 220),
      cardTitle: cleanText(next.collage?.cardTitle, DEFAULT_HOMEPAGE_SETTINGS.collage.cardTitle, 120),
      cardText: cleanText(next.collage?.cardText, DEFAULT_HOMEPAGE_SETTINGS.collage.cardText, 360),
      images: normalizeImageSet(next.collage?.images || {}),
    },
    feature: {
      quote: cleanText(next.feature?.quote, DEFAULT_HOMEPAGE_SETTINGS.feature.quote, 260),
      image: cleanUrl(next.feature?.image, DEFAULT_HOMEPAGE_SETTINGS.feature.image),
      darkTitle: cleanText(next.feature?.darkTitle, DEFAULT_HOMEPAGE_SETTINGS.feature.darkTitle, 140),
      darkText: cleanText(next.feature?.darkText, DEFAULT_HOMEPAGE_SETTINGS.feature.darkText, 400),
      linkLabel: cleanText(next.feature?.linkLabel, DEFAULT_HOMEPAGE_SETTINGS.feature.linkLabel, 80),
      linkHref: cleanUrl(next.feature?.linkHref, DEFAULT_HOMEPAGE_SETTINGS.feature.linkHref),
      lightTitle: cleanText(next.feature?.lightTitle, DEFAULT_HOMEPAGE_SETTINGS.feature.lightTitle, 140),
      lightText: cleanText(next.feature?.lightText, DEFAULT_HOMEPAGE_SETTINGS.feature.lightText, 360),
    },
    showcase: {
      label: cleanText(next.showcase?.label, DEFAULT_HOMEPAGE_SETTINGS.showcase.label, 80),
      title: cleanText(next.showcase?.title, DEFAULT_HOMEPAGE_SETTINGS.showcase.title, 180),
      projectCount: cleanCount(next.showcase?.projectCount, DEFAULT_HOMEPAGE_SETTINGS.showcase.projectCount, 1, 16),
    },
    approach: {
      label: cleanText(next.approach?.label, DEFAULT_HOMEPAGE_SETTINGS.approach.label, 80),
      title: cleanText(next.approach?.title, DEFAULT_HOMEPAGE_SETTINGS.approach.title, 180),
      image: cleanImageValue(next.approach?.image, DEFAULT_HOMEPAGE_SETTINGS.approach.image),
      items: normalizeApproachItems(next.approach?.items),
    },
    detail: {
      label: cleanText(next.detail?.label, DEFAULT_HOMEPAGE_SETTINGS.detail.label, 80),
      title: cleanText(next.detail?.title, DEFAULT_HOMEPAGE_SETTINGS.detail.title, 160),
      images: Array.isArray(next.detail?.images)
        ? next.detail.images.map((item) => cleanImageValue(item, '')).filter(Boolean).slice(0, 12)
        : DEFAULT_HOMEPAGE_SETTINGS.detail.images,
    },
    testimonials: {
      label: cleanText(next.testimonials?.label, DEFAULT_HOMEPAGE_SETTINGS.testimonials.label, 80),
      title: cleanText(next.testimonials?.title, DEFAULT_HOMEPAGE_SETTINGS.testimonials.title, 180),
      count: cleanCount(next.testimonials?.count, DEFAULT_HOMEPAGE_SETTINGS.testimonials.count, 1, 20),
      items: normalizeTestimonials(next.testimonials?.items),
    },
    cta: {
      label: cleanText(next.cta?.label, DEFAULT_HOMEPAGE_SETTINGS.cta.label, 80),
      title: cleanText(next.cta?.title, DEFAULT_HOMEPAGE_SETTINGS.cta.title, 180),
      buttonLabel: cleanText(next.cta?.buttonLabel, DEFAULT_HOMEPAGE_SETTINGS.cta.buttonLabel, 80),
      buttonHref: cleanUrl(next.cta?.buttonHref, DEFAULT_HOMEPAGE_SETTINGS.cta.buttonHref),
    },
  };
}

export function readHomepageSettings() {
  try {
    if (!fs.existsSync(HOMEPAGE_SETTINGS_PATH)) return DEFAULT_HOMEPAGE_SETTINGS;
    const raw = JSON.parse(fs.readFileSync(HOMEPAGE_SETTINGS_PATH, 'utf8'));
    return normalizeHomepageSettings(raw);
  } catch {
    return DEFAULT_HOMEPAGE_SETTINGS;
  }
}

export function writeHomepageSettings(input = {}) {
  const normalized = normalizeHomepageSettings(input);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(HOMEPAGE_SETTINGS_PATH, JSON.stringify(normalized, null, 2));
  return normalized;
}

export async function readHomepageSettingsFromDb(prisma) {
  try {
    const existing = await prisma.siteSetting.findUnique({ where: { key: HOMEPAGE_SETTINGS_KEY } });
    if (existing?.value) return normalizeHomepageSettings(JSON.parse(existing.value));

    const migrated = readHomepageSettings();
    await writeHomepageSettingsToDb(prisma, migrated);
    return migrated;
  } catch (err) {
    console.error('Failed to read homepage settings from DB', err);
    return readHomepageSettings();
  }
}

export async function writeHomepageSettingsToDb(prisma, input = {}) {
  const normalized = normalizeHomepageSettings(input);
  const now = new Date().toISOString();

  await prisma.siteSetting.upsert({
    where: { key: HOMEPAGE_SETTINGS_KEY },
    create: {
      key: HOMEPAGE_SETTINGS_KEY,
      value: JSON.stringify(normalized),
      createdAt: now,
      updatedAt: now,
    },
    update: {
      value: JSON.stringify(normalized),
      updatedAt: now,
    },
  });

  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(HOMEPAGE_SETTINGS_PATH, JSON.stringify(normalized, null, 2));
  } catch (err) {
    console.warn('Failed to mirror homepage settings to file', err);
  }

  return normalized;
}
