export type DraftLink = {
  label: string;
  to: string;
};

export type DraftMetric = {
  value: string;
  label: string;
};

export type DraftHighlight = {
  title: string;
  text: string;
};

export type DraftService = {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  accent: string;
};

export type DraftProcessStep = {
  step: string;
  title: string;
  description: string;
};

export type DraftTestimonial = {
  quote: string;
  name: string;
  role: string;
  image?: string | null;
  date?: string;
};

export type DraftProjectPlaceholder = {
  title: string;
  category: string;
  location: string;
  year: string;
  summary: string;
  href: string;
  accent: string;
};

export type DraftBlogPlaceholder = {
  title: string;
  excerpt: string;
  href: string;
  tag: string;
};

export const homepageDraft = {
  hero: {
    eyebrow: 'Alexandra Diz / Interior Architecture',
    title: 'Interiors with calm, structure, and a clear point of view.',
    description:
      'Design-led remodels shaped around proportion, materials, and daily comfort.',
    primaryCta: { label: 'Start Your Project', to: '/contact' },
    secondaryCta: { label: 'View Projects', to: '/projects' },
    videoPoster:
      '/uploads/home/alexandra.jpg',
    media: {
      kicker: 'Studio Reel Placeholder',
      title: 'Studio perspective',
      caption:
        'A quiet place for a short behind-the-scenes film later.',
    },
  },
  intro: {
    label: 'Why Clients Come Here',
    title: 'A personal studio for homes that need both taste and method.',
    text:
      'Alexandra helps clients turn complex remodeling decisions into a calm, edited interior direction.',
    portraitPrimary:
      '/uploads/home/Alexandra-2.jpg',
    materialImages: [
      '/uploads/projects/pure-elegance-kitchen/images/original/001-1000-alexandradiz-859e92c9414fd48c332d8f31a1bd5a7b.jpg',
      '/uploads/projects/wooden-comfort-kitchen-fremont/images/original/001-1000-alexandradiz-933209ff0db963dda1e69e1744e91a0c.jpg',
      '/uploads/projects/bathroom-in-victorian-style-palo-alto/images/original/001-1000-alexandradiz-328f38254dbed2250885e1eb31b6699e.jpg',
    ],
    quote:
      'Every decision should feel inevitable by the time it reaches the client.',
    highlights: [
      {
        title: 'Creative Direction',
        text: 'A strong aesthetic point of view anchored in practical construction choices.',
      },
      {
        title: 'Client Translation',
        text: 'Complex remodel decisions are reduced to clear, confident next steps.',
      },
      {
        title: 'Premium Calm',
        text: 'The tone is elevated without becoming distant or performative.',
      },
    ],
    fallbackMetrics: [
      { value: '01', label: 'Principal voice' },
      { value: '08', label: 'Homepage sections' },
      { value: '360', label: 'Details considered' },
    ] satisfies DraftMetric[],
  },
  services: {
    label: 'Services',
    title: 'Engagements designed around clarity, not noise.',
    text:
      'The service mix should read as strategic and premium: fewer promises, stronger control points, and visible confidence in scope.',
    items: [
      {
        id: '01',
        title: 'Interior Architecture',
        description:
          'Spatial planning, materials, millwork direction, and finish composition for full-home and room-specific remodels.',
        bullets: ['Layout strategy', 'Finish language', 'Joinery direction'],
        accent: '#dbc7ae',
      },
      {
        id: '02',
        title: 'Kitchen Remodeling',
        description:
          'Layouts, storage logic, and finish decisions calibrated around how the kitchen actually needs to work every day.',
        bullets: ['Flow planning', 'Material decisions', 'Family use'],
        accent: '#bda58d',
      },
      {
        id: '03',
        title: 'Bathroom Design',
        description:
          'Bathrooms that read as composed and calm while still holding up under the practical demands of remodeling.',
        bullets: ['Stone rhythm', 'Fixture editing', 'Spa-level calm'],
        accent: '#9e846c',
      },
      {
        id: '04',
        title: 'Full-home Transformation',
        description:
          'A whole-house direction where architectural decisions, finish pacing, and atmosphere stay aligned from room to room.',
        bullets: ['Concept continuity', 'Phase clarity', 'Signature finish'],
        accent: '#7f6652',
      },
    ] satisfies DraftService[],
  },
  process: {
    label: 'Process',
    title: 'A process that feels steady, selective, and deeply prepared.',
    text:
      'The sequence is written to reassure premium clients: there is taste here, but there is also method.',
    steps: [
      {
        step: '01',
        title: 'Plan',
        description:
          'We define the ambition, the constraints, and the emotional target before design language is set.',
      },
      {
        step: '02',
        title: 'Refine',
        description:
          'Concept, references, and material logic are edited into one coherent route instead of multiple diluted options.',
      },
      {
        step: '03',
        title: 'Build',
        description:
          'Selections, drawings, and execution priorities are organized so the project stays legible under pressure.',
      },
      {
        step: '04',
        title: 'Reveal',
        description:
          'The final layer focuses on atmosphere: proportion, restraint, and the details that make the home feel authored.',
      },
    ] satisfies DraftProcessStep[],
  },
  projects: {
    label: 'Projects Gateway',
    title: 'Selected work, edited down to the essentials.',
    text:
      'A short path into kitchens, bathrooms, full-home remodels, ADU projects, and fireplace transformations.',
    cta: { label: 'Browse All Projects', to: '/projects' },
    placeholders: [
      {
        title: 'Palo Alto Residence',
        category: 'Full House',
        location: 'Palo Alto, CA',
        year: '2025',
        summary: 'A warm modern remodel shaped around calm circulation and quiet material contrast.',
        href: '/projects',
        accent: '#d7c0a9',
      },
      {
        title: 'Los Altos Kitchen',
        category: 'Kitchens',
        location: 'Los Altos, CA',
        year: '2024',
        summary: 'An edited family kitchen with sculptural storage, softened edges, and strong light control.',
        href: '/projects',
        accent: '#b59476',
      },
      {
        title: 'Hillsborough Bath Suite',
        category: 'Bathroom',
        location: 'Hillsborough, CA',
        year: '2024',
        summary: 'A spa-like suite where stone rhythm and joinery precision carry the atmosphere.',
        href: '/projects',
        accent: '#8f725c',
      },
    ] satisfies DraftProjectPlaceholder[],
  },
  testimonials: {
    label: 'Testimonials',
    title: 'Client notes from completed work.',
    items: [
      {
        quote:
          'Alexandra brought calm to a complicated remodel and kept every design move feeling intentional.',
        name: 'Private Client',
        role: 'Full-home remodel',
      },
      {
        quote:
          'Her eye is sharp, but what stood out more was how decisively she filtered decisions for us.',
        name: 'Homeowner Couple',
        role: 'Kitchen and bath renovation',
      },
      {
        quote:
          'The result feels elevated without trying too hard, which is exactly what we hoped for.',
        name: 'Repeat Client',
        role: 'Interior refresh and styling',
      },
    ] satisfies DraftTestimonial[],
  },
  blog: {
    label: 'Journal',
    title: 'Ideas, references, and project thinking worth opening.',
    text:
      'If live posts exist, surface the freshest ones. If not, the section still reads like an intentional editorial preview.',
    cta: { label: 'Read The Journal', to: '/blog' },
    placeholders: [
      {
        title: 'How to keep a remodel feeling composed during selection fatigue',
        excerpt:
          'A short editorial note on narrowing materials, maintaining coherence, and avoiding decision drift.',
        href: '/blog',
        tag: 'Process',
      },
      {
        title: 'What makes a premium kitchen feel quiet instead of cold',
        excerpt:
          'A practical take on warmth, restraint, and where texture should carry the conversation.',
        href: '/blog',
        tag: 'Kitchens',
      },
      {
        title: 'The role of finish pacing in a full-home remodel',
        excerpt:
          'Why the order of decisions matters as much as the decisions themselves when the scope expands.',
        href: '/blog',
        tag: 'Remodeling',
      },
    ] satisfies DraftBlogPlaceholder[],
  },
  finalCta: {
    label: 'Next Step',
    title: 'If the brief is serious, the homepage should invite a real conversation.',
    text:
      'Close with direct language and two clear paths: contact for active projects, or explore the process for clients still calibrating scope.',
    primaryCta: { label: 'Book A Conversation', to: '/contact' },
    secondaryCta: { label: 'See The Process', to: '/services' },
    aside: 'Available for select residential remodels and design-led renovations.',
  },
};
