import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export default function BlogPage() {
  const { blogPosts, site } = useAppStore();

  return (
    <>
      <Helmet><title>Blog — {site?.name || 'Alexandra Diz'}</title><meta name="description" content="Interior design tips, project stories, and trends" /></Helmet>
      <main className="container" style={{ padding: '120px 15px 60px' }}>
        <motion.header className="page-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ color: '#fff' }}>Design Journal</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Insights, trends, and stories from our projects</p>
        </motion.header>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
          {blogPosts?.map((post: any, i: number) => (
            <motion.article key={post.id} className="blog-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Link to={`/blog/${post.slug}`}>
                {post.coverImage && <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ color: '#fff', fontFamily: "'GilroyExtraBold', sans-serif", fontSize: '18px', fontWeight: 800, margin: '0 0 10px' }}>{post.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.5, margin: '0 0 15px' }}>{post.excerpt}</p>
                  <span style={{ color: 'rgba(198,164,123,1)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Read more →</span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </main>
    </>
  );
}
