import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { BlockRenderer } from '../components/blocks';
import { parseBlogArticleSections, parseBlogPostBlocks } from '../lib/blogBlockTemplates';
import { useAppStore } from '../store/useAppStore';
import { absoluteUrl, imageUrl } from '../lib/seo';
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
  const canonicalPath = `/blog/${post.slug}`;
  const description = post.seoDescription || post.excerpt || `${post.title} by Alexandra Diz Architecture.`;

  return (
    <>
      <Helmet>
        <title>{post.seoTitle || post.title} - {site?.name}</title>
        <meta name="description" content={description} />
        {post.seoKeywords ? <meta name="keywords" content={post.seoKeywords} /> : null}
        <link rel="canonical" href={absoluteUrl(canonicalPath)} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={absoluteUrl(canonicalPath)} />
        {post.coverImage ? <meta property="og:image" content={imageUrl(post.coverImage)} /> : null}
        <meta property="og:type" content="article" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description,
            url: absoluteUrl(canonicalPath),
            datePublished: post.publishedAt,
            image: imageUrl(post.coverImage),
            author: { '@type': 'Organization', name: site?.name || 'Alexandra Diz Architecture' },
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
                  <div className={styles.sectionText}>
                    {String(section.text || '')
                      .split(/\n{2,}/)
                      .map((paragraph) => paragraph.trim())
                      .filter(Boolean)
                      .map((paragraph, paragraphIndex) => (
                        <p key={paragraphIndex}>{paragraph}</p>
                      ))}
                  </div>
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
