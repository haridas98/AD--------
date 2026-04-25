import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { BlockRenderer } from '../components/blocks';
import { parseBlogArticleSections, parseBlogPostBlocks } from '../lib/blogBlockTemplates';
import { useAppStore } from '../store/useAppStore';
import styles from './BlogPostPage.module.scss';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { blogPosts, site } = useAppStore();
  const post = blogPosts?.find((p: any) => p.slug === slug);

  if (!post) return <Navigate to="/blog" replace />;

  const blocks = parseBlogPostBlocks(post);
  const articleSections = parseBlogArticleSections(post.content);
  const leadBlocks = blocks.filter((block: any) => block.type !== 'ctaSection').slice(0, 2);
  const ctaBlocks = blocks.filter((block: any) => block.type === 'ctaSection').slice(-1);

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
          <BlockRenderer blocks={leadBlocks} />
          {articleSections.length ? (
            <article className={styles.body}>
              <p className={styles.kicker}>Design Journal</p>
              <h1>{post.title}</h1>
              {post.excerpt ? <p className={styles.lead}>{post.excerpt}</p> : null}
              {articleSections.map((section: any, index: number) => (
                <section key={`${section.title}-${index}`} className={styles.section}>
                  <h2>{section.title}</h2>
                  {String(section.text || '')
                    .split(/\n{2,}/)
                    .map((paragraph) => paragraph.trim())
                    .filter(Boolean)
                    .map((paragraph, paragraphIndex) => (
                      <p key={paragraphIndex}>{paragraph}</p>
                    ))}
                </section>
              ))}
            </article>
          ) : null}
          <BlockRenderer blocks={ctaBlocks} />
        </div>
      </motion.main>
    </>
  );
}
