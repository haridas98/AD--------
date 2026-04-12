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
      <motion.main className="container blog-post-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {post.coverImage && <img src={post.coverImage} alt={post.title} className="post-cover" />}
        <h1>{post.title}</h1>
        {post.publishedAt && <p className="post-date">{new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
        <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content }} />
      </motion.main>
    </>
  );
}
