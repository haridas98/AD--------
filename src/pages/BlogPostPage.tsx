import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import styles from './BlogPostPage.module.scss';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { blogPosts, site } = useAppStore();
  const post = blogPosts?.find((p: any) => p.slug === slug);

  if (!post) return <Navigate to="/blog" replace />;

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
        <article className={styles.article}>
          <section className={styles.hero}>
            {post.coverImage ? <img src={post.coverImage} alt={post.title} className={styles.heroImage} /> : null}
            <div className={styles.heroOverlay} />
            <div className={styles.heroContent}>
              <span className={styles.meta}>
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Design Journal'}
              </span>
              <h1>{post.title}</h1>
              {post.excerpt ? <p>{post.excerpt}</p> : null}
            </div>
          </section>
          <div className={styles.body} dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </motion.main>
    </>
  );
}
