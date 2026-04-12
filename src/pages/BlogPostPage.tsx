import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { blogPosts, site } = useAppStore();
  const post = blogPosts?.find((p: any) => p.slug === slug);

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <>
      <Helmet>
        <title>{post.seoTitle || post.title} — {site?.name}</title>
        <meta name="description" content={post.seoDescription || post.excerpt} />
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", "headline": post.title, "description": post.excerpt, "datePublished": post.publishedAt })}</script>
      </Helmet>
      <motion.main className="container blog-post-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '120px 15px 60px', maxWidth: '800px' }}>
        {post.coverImage && <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '8px', marginBottom: '30px' }} />}
        <h1 style={{ color: '#fff', fontFamily: "'GilroyExtraBold', sans-serif", fontSize: '32px', fontWeight: 800, margin: '0 0 10px' }}>{post.title}</h1>
        {post.publishedAt && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0 0 30px' }}>{new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
        <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content }} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px', lineHeight: 1.7 }} />
        <style>{`.blog-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; } .blog-content h2 { color: #fff; font-family: 'GilroyExtraBold', sans-serif; margin-top: 40px; } .blog-content ul { padding-left: 20px; } .blog-content li { margin-bottom: 8px; }`}</style>
      </motion.main>
    </>
  );
}
