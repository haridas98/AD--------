import React, { useMemo } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { BlockItem, BlockRenderer } from '../components/blocks';
import { useAppStore } from '../store/useAppStore';
import styles from './ProjectPage.module.scss';

function parseBlocks(content: any): BlockItem[] {
  if (!content) return [];
  if (typeof content === 'string') {
    try { return JSON.parse(content); } catch { return []; }
  }
  return Array.isArray(content) ? content : [];
}

function collectProjectImages(blocks: BlockItem[]) {
  return blocks.flatMap((block: any) => {
    if (block.type === 'heroImage' && block.data?.image) return [block.data.image];
    if (block.type === 'imageGrid') return (block.data?.images || []).map((item: any) => typeof item === 'string' ? item : item?.url).filter(Boolean);
    if (block.type === 'beforeAfter') return [block.data?.beforeImage, block.data?.afterImage].filter(Boolean);
    if (block.type === 'refinedSlider') return (block.data?.images || []).map((item: any) => typeof item === 'string' ? item : item?.url).filter(Boolean);
    return [];
  }).filter(Boolean);
}

function buildProjectStory(project: any, categoryName: string) {
  const place = [project.cityName, project.year].filter(Boolean).join(', ') || 'California';

  return {
    overview: `${project.title} is currently presented as a fuller case study with temporary narrative copy. The goal is to make the portfolio read like a premium project story before the final owner-approved content is entered manually.`,
    scope: `For this ${categoryName.toLowerCase()} project in ${place}, the placeholder structure focuses on cleaner circulation, calmer visual rhythm, sharper storage logic, and a more resolved material palette.`,
    process: 'The current layout walks through concept, practical decisions, visual accents, and the final impression of the space. This temporary story can later be replaced section by section from the admin editor.',
    results: 'The result is a project page that feels like a real editorial case study instead of a short gallery. It gives enough context for presentation, sales, and client review while the final text is still being prepared.',
  };
}

function enrichProjectBlocks(project: any, categoryName: string, blocks: BlockItem[]) {
  const existingTypes = new Set(blocks.map((block) => block.type));
  if (existingTypes.has('refinedSlider') || existingTypes.has('circleDetail') || existingTypes.has('editorialNote') || existingTypes.has('mosaicPreset')) {
    return blocks;
  }

  const imagePool = collectProjectImages(blocks);
  const fallbackImage = imagePool[0];
  if (!fallbackImage) return blocks;

  const repeated = Array.from({ length: 4 }, (_, index) => ({
    url: imagePool[index] || fallbackImage,
    alt: `${project.title} ${index + 1}`,
  }));
  const story = buildProjectStory(project, categoryName);

  const extraBlocks: BlockItem[] = [];

  if (!existingTypes.has('metaInfo')) {
    extraBlocks.push({
      id: `auto-meta-${project.id}`,
      type: 'metaInfo',
      data: {
        items: [
          { label: 'Category', value: categoryName },
          { label: 'Location', value: project.cityName || 'California' },
          { label: 'Year', value: String(project.year || 'In progress') },
          { label: 'Status', value: project.isPublished ? 'Published presentation' : 'Draft presentation' },
        ],
      },
    });
  }

  if (!existingTypes.has('editorialNote')) {
    extraBlocks.push({
      id: `auto-editorial-${project.id}`,
      type: 'editorialNote',
      data: {
        eyebrow: categoryName,
        title: `${project.title} overview`,
        note: story.overview,
        image: repeated[1].url,
      },
    });
  }

  if (!existingTypes.has('typography')) {
    extraBlocks.push({
      id: `auto-typography-${project.id}`,
      type: 'typography',
      data: {
        title: 'What was done',
        content: `Planning, composition, finish coordination, furniture rhythm, storage logic, and the final visual balance of the interior.\n\n${story.scope}`,
        size: 'lg',
      },
    });
  }

  if (!existingTypes.has('sideBySide')) {
    extraBlocks.push({
      id: `auto-side-${project.id}`,
      type: 'sideBySide',
      data: {
        title: 'Design direction',
        text: `${story.process}\n\nThis section is intentionally verbose enough to make the project page feel complete while the permanent copy is still pending.`,
        image: repeated[2].url,
        imagePosition: 'right',
      },
    });
  }

  if (!existingTypes.has('refinedSlider')) {
    extraBlocks.push({
      id: `auto-slider-${project.id}`,
      type: 'refinedSlider',
      data: {
        title: 'Project walkthrough',
        description: 'Temporary image sequence for portfolio presentation, using repeated project assets until the final set is curated.',
        thumbnailPosition: 'bottom',
        images: repeated,
      },
    });
  }

  if (!existingTypes.has('circleDetail')) {
    extraBlocks.push({
      id: `auto-circle-${project.id}`,
      type: 'circleDetail',
      data: {
        title: 'Key details',
        description: 'A temporary detail summary until the final selections are entered.',
        items: [
          { label: 'Material palette', image: repeated[0].url, alt: 'Material palette' },
          { label: 'Storage logic', image: repeated[1].url, alt: 'Storage logic' },
          { label: 'Lighting mood', image: repeated[2].url, alt: 'Lighting mood' },
          { label: 'Visual accents', image: repeated[3].url, alt: 'Visual accents' },
        ],
      },
    });
  }

  if (!existingTypes.has('mosaicPreset')) {
    extraBlocks.push({
      id: `auto-mosaic-${project.id}`,
      type: 'mosaicPreset',
      data: {
        title: 'Composition highlights',
        preset: 'a',
        images: repeated,
      },
    });
  }

  extraBlocks.push({
    id: `auto-results-${project.id}`,
    type: 'typography',
    data: {
      title: 'Result',
      content: story.results,
      size: 'md',
    },
  });

  if (!existingTypes.has('ctaSection')) {
    extraBlocks.push({
      id: `auto-cta-${project.id}`,
      type: 'ctaSection',
      data: {
        title: 'Planning a similar remodel?',
        text: 'This is placeholder project-page content and will be replaced with the final owner-approved material later.',
        buttonText: 'Contact us',
        buttonLink: '/contact',
      },
    });
  }

  return [...blocks, ...extraBlocks];
}

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { projects, site } = useAppStore();

  const catSlug = location.pathname.split('/')[1];
  const category = useAppStore.getState().categories.find((item) => item.slug === catSlug || item.id === catSlug);
  const project = projects.find((item) => item.slug === slug);

  if (!project) return <Navigate to="/" replace />;

  const blocks = useMemo(() => {
    const parsed = parseBlocks(project.content);
    return enrichProjectBlocks(project, category?.name || catSlug, parsed);
  }, [project, category?.name, catSlug]);

  return (
    <>
      <Helmet>
        <title>{project.seoTitle || project.title} — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={project.seoDescription || category?.name || ''} />
        <meta property="og:title" content={project.title} />
        {project.seoDescription ? <meta property="og:description" content={project.seoDescription} /> : null}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: project.title,
            description: project.seoDescription,
            category: category?.name,
            author: { '@type': 'Organization', name: site?.name },
          })}
        </script>
      </Helmet>
      <motion.main
        className={`${styles.page} project-page`}
        data-project-page
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.content}>
          <BlockRenderer blocks={blocks} />
        </div>
      </motion.main>
    </>
  );
}
