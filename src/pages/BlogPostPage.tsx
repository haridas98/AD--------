import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { BlockRenderer } from '../components/blocks';
import { parseBlogPostBlocks } from '../lib/blogBlockTemplates';
import { useAppStore } from '../store/useAppStore';
import styles from './BlogPostPage.module.scss';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { blogPosts, site } = useAppStore();
  const post = blogPosts?.find((p: any) => p.slug === slug);

  if (!post) return <Navigate to="/blog" replace />;

  const blocks = parseBlogPostBlocks(post);

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
