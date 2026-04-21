import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import styles from './BlogPage.module.scss';

export default function BlogPage() {
  const { blogPosts, site } = useAppStore();

  return (
    <>
      <Helmet><title>Blog — {site?.name || 'Alexandra Diz'}</title><meta name="description" content="Interior design tips, project stories, and trends" /></Helmet>
      <main className={`page-shell page-shell--offset ${styles.page}`}>
        <div className="page-shell__portfolio">
          <motion.header className={styles.header} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-white">Design Journal</h1>
            <p className="text-secondary">Insights, trends, and stories from our projects</p>
          </motion.header>
          <div className={styles.grid}>
            {blogPosts?.map((post: any, i: number) => (
              <motion.article key={post.id} className="blog-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}>
                <Link to={`/blog/${post.slug}`}>
                  {post.coverImage && <img src={post.coverImage} alt={post.title} />}
                  <div className="blog-card-body">
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <span className="read-more">Read more →</span>
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
