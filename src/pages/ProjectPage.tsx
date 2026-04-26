import React, { useMemo } from 'react';
import { Link, useParams, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { BlockRenderer } from '../components/blocks';
import { useAppStore } from '../store/useAppStore';
import { parseProjectContent } from '../lib/projectBlockTemplates';
import {
  getCanonicalPortfolioProjectPathForCategory,
  resolvePortfolioSectionFromPathname,
} from '../lib/portfolioRoutes';
import { sortProjectsForPortfolio } from '../lib/projectOrdering';
import styles from './ProjectPage.module.scss';

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { categories, projects, site, loading } = useAppStore();

  const section = resolvePortfolioSectionFromPathname(location.pathname);
  const category = categories.find((item) => item.slug === section?.legacySlug || item.id === section?.legacySlug);
  const project = projects.find((item) => item.slug === slug);
  const projectCategory = project ? categories.find((item) => item.id === project.categoryId) || category : category;
  const blocks = useMemo(() => {
    if (!project) return [];

    const parsed = parseProjectContent(project.content);
    return parsed.map((block, index) => {
      if (index !== 0 || block.type !== 'heroImage') return block;
      return { ...block, data: { ...block.data, variant: 'immersive' } };
    });
  }, [project?.content]);
  const orderedProjects = useMemo(
    () => project
      ? sortProjectsForPortfolio(projects.filter((item) => item.isPublished && !item.deletedAt && item.categoryId === project.categoryId))
      : [],
    [projects, project?.categoryId],
  );

  if (!project && (loading || !site)) {
    return (
      <main className={`${styles.page} project-page`} data-project-page>
        <div className={styles.content}>Loading...</div>
      </main>
    );
  }

  if (!project) return <Navigate to="/" replace />;

  const projectIndex = orderedProjects.findIndex((item) => item.id === project.id);
  const previousProject = projectIndex > 0 ? orderedProjects[projectIndex - 1] : null;
  const nextProject = projectIndex >= 0 && projectIndex < orderedProjects.length - 1 ? orderedProjects[projectIndex + 1] : null;
  const projectNavigation = {
    previous: previousProject
      ? {
          title: previousProject.title,
          href: getCanonicalPortfolioProjectPathForCategory(projectCategory, previousProject.slug),
        }
      : null,
    next: nextProject
      ? {
          title: nextProject.title,
          href: getCanonicalPortfolioProjectPathForCategory(projectCategory, nextProject.slug),
        }
      : null,
  };

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
          <BlockRenderer
            blocks={blocks}
            context={{
              project: {
                title: project.title,
                cityName: project.cityName,
                year: project.year,
                completedAt: project.completedAt,
                categoryName: projectCategory?.name,
              },
              projectNavigation,
            }}
          />
          {(previousProject || nextProject) ? (
            <nav className={styles.projectPager} aria-label="Project navigation">
              {previousProject ? (
                <Link className={`${styles.projectPagerLink} ${styles.projectPagerPrev}`} to={getCanonicalPortfolioProjectPathForCategory(projectCategory, previousProject.slug)}>
                  <svg width="24" height="12" viewBox="0 0 24 12" fill="none" aria-hidden="true">
                    <path d="M23 6H1M6 1 1 6l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Previous project</span>
                  <strong>{previousProject.title}</strong>
                </Link>
              ) : <span />}
              {nextProject ? (
                <Link className={`${styles.projectPagerLink} ${styles.projectPagerNext}`} to={getCanonicalPortfolioProjectPathForCategory(projectCategory, nextProject.slug)}>
                  <span>Next project</span>
                  <strong>{nextProject.title}</strong>
                  <svg width="24" height="12" viewBox="0 0 24 12" fill="none" aria-hidden="true">
                    <path d="M1 6h22M18 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ) : <span />}
            </nav>
          ) : null}
        </div>
      </motion.main>
    </>
  );
}
