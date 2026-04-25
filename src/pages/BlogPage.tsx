import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import styles from './BlogPage.module.scss';

export default function BlogPage() {
  const { blogPosts, site } = useAppStore();
  const publishedPosts = (blogPosts || []).filter((post: any) => post.isPublished !== false);

  return (
    <>
      <Helmet>
        <title>Blog - {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content="Interior design tips, project stories, and trends" />
      </Helmet>
      <main className={styles.page}>
        <div className={styles.inner}>
          <motion.header className={styles.header} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <span>Design Journal</span>
            <h1>Ideas for calmer, sharper interiors.</h1>
            <p>Notes on planning, materials, remodeling decisions, and the details that make a home feel resolved.</p>
          </motion.header>

          <div className={styles.grid}>
            {publishedPosts.map((post: any, i: number) => (
              <motion.article
                key={post.id}
                className={`${styles.card} ${i === 0 ? styles.cardLead : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -6 }}
              >
                <Link to={`/blog/${post.slug}`} className={styles.cardLink}>
                  <div
                    className={styles.cardImage}
                    style={post.coverImage ? { backgroundImage: `url(${post.coverImage})` } : undefined}
                  />
                  <div className={styles.cardBody}>
                    <span className={styles.cardMeta}>
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Journal'}
                    </span>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <span className={styles.readMore}>Read more</span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
