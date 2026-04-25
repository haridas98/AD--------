import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { BlockRenderer, type BlockItem } from '../components/blocks';
import { useAppStore } from '../store/useAppStore';
import styles from './BlogPostPage.module.scss';

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

function buildBlogBlocks(post: any): BlockItem[] {
  const images = extractImages(post.content);
  const sections = extractSections(post.content);
  const firstSection = sections[0];
  const secondSection = sections[1] || sections[0];
  const extraSections = sections.slice(2);
  const cover = post.coverImage || images[0];
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

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { blogPosts, site } = useAppStore();
  const post = blogPosts?.find((p: any) => p.slug === slug);

  if (!post) return <Navigate to="/blog" replace />;

  const blocks = buildBlogBlocks(post);

  return (
    <>
      <Helmet>
        <title>{post.seoTitle || post.title} - {site?.name}</title>
        <meta name="description" content={post.seoDescription || post.excerpt} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            datePublished: post.publishedAt,
            image: post.coverImage,
          })}
        </script>
      </Helmet>
      <motion.main className={styles.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className={styles.article}>
          <BlockRenderer blocks={blocks} />
        </div>
      </motion.main>
    </>
  );
}
