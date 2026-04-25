import type { BlockItem } from '../components/blocks';

function decodeHtml(value: string) {
  if (typeof document === 'undefined') return value;
  const element = document.createElement('textarea');
  element.innerHTML = value;
  return element.value;
}

function stripHtml(value: string) {
  return decodeHtml(String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function extractImages(content: string) {
  return [...String(content || '').matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter(Boolean);
}

function extractSections(content: string) {
  return String(content || '')
    .split(/<h2[^>]*>/i)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [rawTitle, ...rest] = chunk.split(/<\/h2>/i);
      const text = stripHtml(rest.join('</h2>').replace(/<img[^>]*>/gi, ''));
      return {
        title: stripHtml(rawTitle),
        text,
      };
    })
    .filter((section) => section.title || section.text);
}

export function parseBlogContentBlocks(content: any): BlockItem[] {
  if (!content) return [];
  if (Array.isArray(content)) return content;
  if (typeof content !== 'string') return [];

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildBlogBaseBlocks(post: any, images: string[] = []): BlockItem[] {
  const title = post?.title || 'Design journal';
  const excerpt = post?.excerpt || 'A practical design note from Alexandra Diz Architecture.';
  const cover = post?.coverImage || images[0] || '';
  const gallery = Array.from(new Set([cover, ...images].filter(Boolean))).slice(0, 6);

  return [
    cover
      ? {
          id: 'blog-hero',
          type: 'heroImage',
          data: {
            title,
            subtitle: excerpt,
            image: cover,
            alt: title,
          },
        }
      : null,
    {
      id: 'blog-editorial-note',
      type: 'editorialNote',
      data: {
        eyebrow: 'Design Journal',
        title: 'Why this matters',
        note: excerpt,
        image: gallery[1] || cover,
        alt: title,
      },
    },
    gallery[2] || cover
      ? {
          id: 'blog-side-by-side',
          type: 'sideBySide',
          data: {
            title: 'Design direction',
            text: 'The strongest interiors are not built from a single material choice. They come from proportion, light, tactile restraint, and decisions that support daily use.',
            image: gallery[2] || cover,
            alt: title,
            imagePosition: 'right',
          },
        }
      : null,
    gallery.length > 1
      ? {
          id: 'blog-image-grid',
          type: 'imageGrid',
          data: {
            columns: 2,
            images: gallery.slice(0, 6).map((url, index) => ({ url, alt: `${title} ${index + 1}` })),
          },
        }
      : null,
    {
      id: 'blog-typography',
      type: 'typography',
      data: {
        title: 'What to consider',
        content: 'Start with the feeling you want the room to hold, then test every finish against maintenance, scale, lighting, and how the space will age over time.',
        size: 'lg',
      },
    },
    {
      id: 'blog-cta',
      type: 'ctaSection',
      data: {
        title: 'Planning your own remodel?',
        text: 'Bring your goals, constraints, and references. We will help translate them into a clear interior direction.',
        buttonText: 'Contact us',
        buttonLink: '/contact',
      },
    },
  ].filter(Boolean) as BlockItem[];
}

export function buildBlogBlocksFromHtml(post: any): BlockItem[] {
  const images = extractImages(post?.content || '');
  const sections = extractSections(post?.content || '');
  const firstSection = sections[0];
  const secondSection = sections[1] || sections[0];
  const extraSections = sections.slice(2);
  const cover = post?.coverImage || images[0];
  const gridImages = images.slice(0, 6).map((url, index) => ({ url, alt: `${post.title} ${index + 1}` }));

  return [
    cover
      ? {
          id: 'blog-hero',
          type: 'heroImage',
          data: {
            title: post.title,
            subtitle: post.excerpt,
            image: cover,
            alt: post.title,
          },
        }
      : null,
    {
      id: 'blog-editorial-note',
      type: 'editorialNote',
      data: {
        eyebrow: 'Design Journal',
        title: firstSection?.title || 'Design perspective',
        note: firstSection?.text || post.excerpt,
        image: images[0] || cover,
        alt: post.title,
      },
    },
    secondSection && (images[1] || cover)
      ? {
          id: 'blog-side-by-side',
          type: 'sideBySide',
          data: {
            title: secondSection.title || 'Material direction',
            text: secondSection.text,
            image: images[1] || cover,
            alt: post.title,
            imagePosition: 'right',
          },
        }
      : null,
    gridImages.length > 1
      ? {
          id: 'blog-image-grid',
          type: 'imageGrid',
          data: {
            columns: 2,
            images: gridImages,
          },
        }
      : null,
    ...extraSections.slice(0, 3).map((section, index) => ({
      id: `blog-typography-${index + 1}`,
      type: 'typography',
      data: {
        title: section.title,
        content: section.text,
        size: index === 0 ? 'lg' : 'md',
      },
    })),
    {
      id: 'blog-cta',
      type: 'ctaSection',
      data: {
        title: 'Planning your own remodel?',
        text: 'Bring your goals, constraints, and references. We will help translate them into a clear interior direction.',
        buttonText: 'Contact us',
        buttonLink: '/contact',
      },
    },
  ].filter(Boolean) as BlockItem[];
}

export function parseBlogPostBlocks(post: any): BlockItem[] {
  const jsonBlocks = parseBlogContentBlocks(post?.content);
  if (jsonBlocks.length) return jsonBlocks;
  return buildBlogBlocksFromHtml(post);
}

export function getBlogBlocksCover(blocks: BlockItem[]) {
  for (const block of blocks || []) {
    if (block.type === 'heroImage' && block.data?.image) return block.data.image;
    if (block.type === 'editorialNote' && block.data?.image) return block.data.image;
    if (block.type === 'sideBySide' && block.data?.image) return block.data.image;
    if (block.type === 'imageGrid' && block.data?.images?.[0]) return block.data.images[0].url || block.data.images[0];
  }
  return '';
}
