import React from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { BlockRenderer } from '../components/blocks';
import { useAppStore } from '../store/useAppStore';
import styles from './ProjectPage.module.scss';

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { projects, site } = useAppStore();

  // Extract category from path
  const catSlug = location.pathname.split('/')[1];
  const categoryId = useAppStore.getState().categories.find((c) => c.slug === catSlug || c.id === catSlug)?.id || catSlug;

  // Find project by slug (unique across all projects)
  const project = projects.find((p) => p.slug === slug);

  if (!project) return <Navigate to="/" replace />;

  const content = typeof project.content === 'string' ? JSON.parse(project.content) : project.content;
  const category = useAppStore.getState().categories.find((c) => c.id === project.categoryId);

  return (
    <>
      <Helmet>
        <title>{project.seoTitle || project.title} — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={project.seoDescription || category?.name || ''} />
        <meta property="og:title" content={project.title} />
        {project.seoDescription && <meta property="og:description" content={project.seoDescription} />}
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "CreativeWork", "name": project.title, "description": project.seoDescription, "category": category?.name, "author": { "@type": "Organization", "name": site?.name } })}</script>
      </Helmet>
      <motion.main className={`${styles.page} project-page`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <BlockRenderer blocks={content} />
      </motion.main>
    </>
  );
}
