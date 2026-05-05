import type { HomepageSettings } from '../types';

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  hero: {
    title: 'Create your dream home',
    image: '/home/Alexandra-2.jpg',
  },
  collage: {
    title: 'the light, the plan, the quiet detail.',
    text: 'Alexandra designs homes from the inside out: how the room moves, where storage belongs, how daylight lands, and which materials should stay in view.',
    quote: 'A room should feel clear before it feels decorated.',
    cardTitle: 'Unseen order',
    cardText: 'Good interiors hide effort: proportions, storage, lighting and finishes quietly doing their job.',
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
    image: '/home/alexandra.jpg',
    darkTitle: 'Rooms with a quieter rhythm',
    darkText: 'Plans, millwork and finishes are edited until the home feels composed, useful and personal.',
    linkLabel: 'Read more',
    linkHref: '/about',
    lightTitle: 'With Alexandra',
    lightText: 'From a single room consultation to full remodel planning, the work stays focused on clarity.',
  },
  showcase: {
    label: 'In focus',
    title: "Homes that reveal the studio's rhythm.",
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
    label: 'Detail motion',
    title: 'One detail changes the next.',
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

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function imageValue(value: any, fallback: any = '') {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return fallback;
  const url = text(value.url, '');
  if (!url) return fallback;
  return {
    url,
    assetId: text(value.assetId, ''),
    projectId: text(value.projectId, ''),
    alt: text(value.alt, ''),
  };
}

function count(value: unknown, fallback: number, min: number, max: number) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, Math.round(next)));
}

function imageSet(input: any = {}) {
  const fallback = DEFAULT_HOMEPAGE_SETTINGS.collage.images;
  return {
    primary: imageValue(input.primary, fallback.primary),
    smallOne: imageValue(input.smallOne, fallback.smallOne),
    wide: imageValue(input.wide, fallback.wide),
    tall: imageValue(input.tall, fallback.tall),
    smallTwo: imageValue(input.smallTwo, fallback.smallTwo),
  };
}

function approachItems(input: any) {
  const source = Array.isArray(input) && input.length ? input : DEFAULT_HOMEPAGE_SETTINGS.approach.items;
  return source.slice(0, 6).map((item: any, index: number) => ({
    number: text(item?.number, DEFAULT_HOMEPAGE_SETTINGS.approach.items[index]?.number || String(index + 1).padStart(2, '0')),
    title: text(item?.title, DEFAULT_HOMEPAGE_SETTINGS.approach.items[index]?.title || ''),
    text: text(item?.text, DEFAULT_HOMEPAGE_SETTINGS.approach.items[index]?.text || ''),
  }));
}

function testimonialItems(input: any) {
  const source = Array.isArray(input) && input.length ? input : [];
  return source.slice(0, 20).map((item: any, index: number) => ({
    date: text(item?.date, ''),
    text: text(item?.text, ''),
    author: text(item?.author, 'Client'),
    link: text(item?.link, ''),
    linkHref: text(item?.linkHref, ''),
    image: text(item?.image, ''),
    projectHref: text(item?.projectHref, ''),
    projectText: text(item?.projectText, ''),
  }));
}

export function normalizeHomepageSettings(input?: Partial<HomepageSettings> | null): HomepageSettings {
  const next: any = input || {};
  return {
    hero: {
      title: text(next.hero?.title, DEFAULT_HOMEPAGE_SETTINGS.hero.title),
      image: text(next.hero?.image, DEFAULT_HOMEPAGE_SETTINGS.hero.image),
    },
    collage: {
      title: text(next.collage?.title, DEFAULT_HOMEPAGE_SETTINGS.collage.title),
      text: text(next.collage?.text, DEFAULT_HOMEPAGE_SETTINGS.collage.text),
      quote: text(next.collage?.quote, DEFAULT_HOMEPAGE_SETTINGS.collage.quote),
      cardTitle: text(next.collage?.cardTitle, DEFAULT_HOMEPAGE_SETTINGS.collage.cardTitle),
      cardText: text(next.collage?.cardText, DEFAULT_HOMEPAGE_SETTINGS.collage.cardText),
      images: imageSet(next.collage?.images),
    },
    feature: {
      quote: text(next.feature?.quote, DEFAULT_HOMEPAGE_SETTINGS.feature.quote),
      image: text(next.feature?.image, DEFAULT_HOMEPAGE_SETTINGS.feature.image),
      darkTitle: text(next.feature?.darkTitle, DEFAULT_HOMEPAGE_SETTINGS.feature.darkTitle),
      darkText: text(next.feature?.darkText, DEFAULT_HOMEPAGE_SETTINGS.feature.darkText),
      linkLabel: text(next.feature?.linkLabel, DEFAULT_HOMEPAGE_SETTINGS.feature.linkLabel),
      linkHref: text(next.feature?.linkHref, DEFAULT_HOMEPAGE_SETTINGS.feature.linkHref),
      lightTitle: text(next.feature?.lightTitle, DEFAULT_HOMEPAGE_SETTINGS.feature.lightTitle),
      lightText: text(next.feature?.lightText, DEFAULT_HOMEPAGE_SETTINGS.feature.lightText),
    },
    showcase: {
      label: text(next.showcase?.label, DEFAULT_HOMEPAGE_SETTINGS.showcase.label),
      title: text(next.showcase?.title, DEFAULT_HOMEPAGE_SETTINGS.showcase.title),
      projectCount: count(next.showcase?.projectCount, DEFAULT_HOMEPAGE_SETTINGS.showcase.projectCount, 1, 16),
    },
    approach: {
      label: text(next.approach?.label, DEFAULT_HOMEPAGE_SETTINGS.approach.label),
      title: text(next.approach?.title, DEFAULT_HOMEPAGE_SETTINGS.approach.title),
      image: imageValue(next.approach?.image, DEFAULT_HOMEPAGE_SETTINGS.approach.image),
      items: approachItems(next.approach?.items),
    },
    detail: {
      label: text(next.detail?.label, DEFAULT_HOMEPAGE_SETTINGS.detail.label),
      title: text(next.detail?.title, DEFAULT_HOMEPAGE_SETTINGS.detail.title),
      images: Array.isArray(next.detail?.images) ? next.detail.images.map((item: any) => imageValue(item, '')).filter(Boolean).slice(0, 12) : [],
    },
    testimonials: {
      label: text(next.testimonials?.label, DEFAULT_HOMEPAGE_SETTINGS.testimonials.label),
      title: text(next.testimonials?.title, DEFAULT_HOMEPAGE_SETTINGS.testimonials.title),
      count: count(next.testimonials?.count, DEFAULT_HOMEPAGE_SETTINGS.testimonials.count, 1, 20),
      items: testimonialItems(next.testimonials?.items),
    },
    cta: {
      label: text(next.cta?.label, DEFAULT_HOMEPAGE_SETTINGS.cta.label),
      title: text(next.cta?.title, DEFAULT_HOMEPAGE_SETTINGS.cta.title),
      buttonLabel: text(next.cta?.buttonLabel, DEFAULT_HOMEPAGE_SETTINGS.cta.buttonLabel),
      buttonHref: text(next.cta?.buttonHref, DEFAULT_HOMEPAGE_SETTINGS.cta.buttonHref),
    },
  };
}
