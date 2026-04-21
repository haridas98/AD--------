import React, { useMemo } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { BlockRenderer } from '../components/blocks';
import { useAppStore } from '../store/useAppStore';
import { parseProjectContent } from '../lib/projectBlockTemplates';
import styles from './ProjectPage.module.scss';

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { projects, site } = useAppStore();

  const catSlug = location.pathname.split('/')[1];
  const category = useAppStore.getState().categories.find((item) => item.slug === catSlug || item.id === catSlug);
  const project = projects.find((item) => item.slug === slug);

  if (!project) return <Navigate to="/" replace />;

  const blocks = useMemo(() => {
    return parseProjectContent(project.content);
  }, [project.content]);

  return (
    <>
      <Helmet>
        <title>{project.seoTitle || project.title} — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={project.seoDescription || category?.name || ''} />
        <meta property="og:title" content={project.title} />
        {project.seoDescription ? <meta property="og:description" content={project.seoDescription} /> : null}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: project.title,
            description: project.seoDescription,
            category: category?.name,
            author: { '@type': 'Organization', name: site?.name },
          })}
        </script>
      </Helmet>
      <motion.main
        className={`${styles.page} project-page`}
        data-project-page
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.content}>
          <BlockRenderer blocks={blocks} />
        </div>
      </motion.main>
    </>
  );
}
