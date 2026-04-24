import React, { useMemo } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { BlockRenderer } from '../components/blocks';
import { useAppStore } from '../store/useAppStore';
import { parseProjectContent } from '../lib/projectBlockTemplates';
import { resolvePortfolioSectionFromPathname } from '../lib/portfolioRoutes';
import styles from './ProjectPage.module.scss';

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { categories, projects, site, loading } = useAppStore();

  const section = resolvePortfolioSectionFromPathname(location.pathname);
  const category = categories.find((item) => item.slug === section?.legacySlug || item.id === section?.legacySlug);
  const project = projects.find((item) => item.slug === slug);

  if (!project && (loading || !site)) {
    return (
      <main className={`${styles.page} project-page`} data-project-page>
        <div className={styles.content}>Loading...</div>
      </main>
    );
  }

  if (!project) return <Navigate to="/" replace />;

  const blocks = useMemo(() => parseProjectContent(project.content), [project.content]);

  return (
    <>
      <Helmet>
        <title>{project.seoTitle || project.title} - {site?.name || 'Alexandra Diz'}</title>
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
        data-project-preset={project.stylePreset || 'default'}
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
