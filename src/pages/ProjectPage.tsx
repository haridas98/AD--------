import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { BlockRenderer } from '../components/blocks';
import { useAppStore } from '../store/useAppStore';

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getProjectBySlug, getCategoryById, site } = useAppStore();
  const project = getProjectBySlug(slug || '');
  const category = project ? getCategoryById(project.categoryId) : null;

  if (!project) return <Navigate to="/" replace />;

  const content = typeof project.content === 'string' ? JSON.parse(project.content) : project.content;

  return (
    <>
      <Helmet>
        <title>{project.seoTitle || project.title} — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={project.seoDescription || category?.name || ''} />
        <meta property="og:title" content={project.title} />
        {project.seoDescription && <meta property="og:description" content={project.seoDescription} />}
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "CreativeWork", "name": project.title, "description": project.seoDescription, "category": category?.name, "author": { "@type": "Organization", "name": site?.name } })}</script>
      </Helmet>
      <motion.main className="project-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <BlockRenderer blocks={content} />
      </motion.main>
    </>
  );
}
