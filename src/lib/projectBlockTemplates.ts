import type { BlockItem } from '../components/blocks';

type ProjectLike = {
  id?: string;
  title?: string;
  cityName?: string;
  year?: string | number;
  isPublished?: boolean;
  content?: any;
};

function fallbackTitle(project: ProjectLike) {
  return project.title || 'Project overview';
}

export function parseProjectContent(content: any): BlockItem[] {
  if (!content) return [];
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch {
      return [];
    }
  }
  return Array.isArray(content) ? content : [];
}

export function collectProjectImages(blocks: BlockItem[]) {
  return blocks
    .flatMap((block: any) => {
      if (block.type === 'heroImage' && block.data?.image) return [block.data.image];
      if (block.type === 'imageGrid') return (block.data?.images || []).map((item: any) => (typeof item === 'string' ? item : item?.url));
      if (block.type === 'beforeAfter') return [block.data?.beforeImage, block.data?.afterImage];
      if (block.type === 'refinedSlider') return (block.data?.images || []).map((item: any) => (typeof item === 'string' ? item : item?.url));
      if (block.type === 'mosaicPreset') return (block.data?.images || []).map((item: any) => (typeof item === 'string' ? item : item?.url));
      if (block.type === 'circleDetail') return (block.data?.items || []).map((item: any) => item?.image);
      if (block.type === 'editorialNote') return [block.data?.image];
      if (block.type === 'sideBySide') return [block.data?.image];
      return [];
    })
    .filter(Boolean);
}

function createImageSeries(imagePool: string[], count: number, title: string) {
  const base = imagePool.filter(Boolean);
  const fallback = base[0] || '';
  return Array.from({ length: count }, (_, index) => ({
    url: base[index % Math.max(base.length, 1)] || fallback,
    alt: `${title} ${index + 1}`,
  }));
}

function buildBeforeAfterBlock(images: Array<{ url: string; alt: string }>, index: number) {
  const before = images[index % images.length] || images[0];
  const after = images[(index + 1) % images.length] || before;
  return {
    id: `base-before-after-${index + 1}`,
    type: 'beforeAfter',
    data: {
      title: index === 0 ? 'Before / After' : `Before / After ${index + 1}`,
      beforeImage: before?.url || '',
      afterImage: after?.url || before?.url || '',
      beforeAlt: before?.alt || `Before ${index + 1}`,
      afterAlt: after?.alt || `After ${index + 1}`,
    },
  };
}

export function buildProjectBaseBlocks(project: ProjectLike, categoryName: string, beforeAfterCount = 1): BlockItem[] {
  const title = fallbackTitle(project);
  const currentBlocks = parseProjectContent(project.content);
  const imagePool = collectProjectImages(currentBlocks);
  const images = createImageSeries(imagePool, Math.max(beforeAfterCount + 10, 10), title);
  const location = project.cityName || '';
  const year = project.year ? String(project.year) : '';
  const categoryLabel = categoryName || 'Project';

  return [
    {
      id: 'base-hero-image',
      type: 'heroImage',
      data: {
        title,
        subtitle: `${title} brings together proportion, materials, light, and practical flow in a composed interior story.`,
        image: images[0]?.url || '',
        alt: title,
      },
    },
    {
      id: 'base-meta-info',
      type: 'metaInfo',
      data: {
        source: 'project',
      },
    },
    {
      id: 'base-editorial-note',
      type: 'editorialNote',
      data: {
        eyebrow: categoryLabel,
        title: `${title} overview`,
        note: `${title} is shaped around clear composition, tactile finishes, and a design rhythm that supports everyday use.`,
        image: images[1]?.url || images[0]?.url || '',
      },
    },
    {
      id: 'base-typography-scope',
      type: 'typography',
      data: {
        title: 'What was done',
        content: 'Planning, composition, finishes, storage logic, lighting rhythm, and the overall mood of the space.',
        size: 'lg',
      },
    },
    {
      id: 'base-side-by-side',
      type: 'sideBySide',
      data: {
        title: 'Design direction',
        text: 'The design direction balances calm materials, clear sightlines, practical storage, and details that make the interior feel resolved.',
        image: images[2]?.url || images[0]?.url || '',
        imagePosition: 'right',
      },
    },
    {
      id: 'base-image-grid',
      type: 'imageGrid',
      data: {
        columns: 2,
        images: images.slice(0, 4),
      },
    },
    {
      id: 'base-refined-slider',
      type: 'refinedSlider',
      data: {
        title: 'Project walkthrough',
        description: 'A calm visual walkthrough of the finished space.',
        thumbnailPosition: 'bottom',
        images: images.slice(0, 6),
      },
    },
    {
      id: 'base-circle-detail',
      type: 'circleDetail',
      data: {
        title: 'Key details',
        description: 'This block helps highlight important accents, materials, or small moments of the project.',
        items: images.slice(0, 5).map((image) => ({
          label: '',
          image: image.url,
          alt: title,
        })),
      },
    },
    {
      id: 'base-mosaic-preset',
      type: 'mosaicPreset',
      data: {
        title: 'Composition highlights',
        preset: 'a',
        images: images.slice(0, 4),
      },
    },
    ...Array.from({ length: Math.max(beforeAfterCount, 1) }, (_, index) => buildBeforeAfterBlock(images, index)),
    {
      id: 'base-typography-result',
      type: 'typography',
      data: {
        title: 'Result',
        content: 'The finished interior reads as balanced, intentional, and practical: a space where atmosphere and daily use support each other.',
        size: 'md',
      },
    },
    {
      id: 'base-cta-section',
      type: 'ctaSection',
      data: {
        title: 'Planning a similar remodel?',
        text: 'Share your goals, constraints, and references, and we will shape them into a clear interior direction.',
        buttonText: 'Contact us',
        buttonLink: '/contact',
      },
    },
  ];
}

export function appendBeforeAfterBlocks(project: ProjectLike, blocks: BlockItem[], count = 10) {
  const title = fallbackTitle(project);
  const images = createImageSeries(collectProjectImages(blocks), Math.max(count + 2, 12), title);
  const existingCount = blocks.filter((block) => block.type === 'beforeAfter').length;

  return [
    ...blocks,
    ...Array.from({ length: count }, (_, index) => buildBeforeAfterBlock(images, existingCount + index)),
  ];
}
