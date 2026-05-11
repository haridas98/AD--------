import React from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { PortfolioProjectCard } from '../components/PortfolioProjectCard';
import {
  getCanonicalPortfolioCategoryPathForCategory,
  getCanonicalPortfolioProjectPathForCategory,
  resolvePortfolioSectionFromPathname,
} from '../lib/portfolioRoutes';
import { collectProjectImages, parseProjectContent } from '../lib/projectBlockTemplates';
import { getProjectDisplayYear, sortProjectsForPortfolio } from '../lib/projectOrdering';
import { absoluteUrl, serviceSchema } from '../lib/seo';
import styles from './CategoryPage.module.scss';

export default function CategoryPage() {
  const location = useLocation();
  const { categories, projects, site } = useAppStore();

  const section = resolvePortfolioSectionFromPathname(location.pathname);
  const category = categories.find((item) => item.slug === section?.legacySlug || item.id === section?.legacySlug);
  const name = category?.name || section?.label || 'Projects';
  const canonicalPath = getCanonicalPortfolioCategoryPathForCategory(category);
  const description = category?.description || `${name} portfolio projects by Alexandra Diz Architecture in California.`;

  const catProjects = sortProjectsForPortfolio(projects.filter(
    (project) => project.categoryId === (category?.id || section?.legacySlug) && project.isPublished && !project.deletedAt,
  ));
  const timelineYears = Array.from(
    new Set(catProjects.map((project) => getProjectDisplayYear(project)).filter(Boolean)),
  );

  function getCover(project: any) {
    return (project.assets || []).find((asset: any) => asset.kind === 'image' && asset.status === 'active' && asset.publicUrl)?.publicUrl
      || collectProjectImages(parseProjectContent(project.content))[0]
      || '';
  }

  if (!catProjects.length) {
    return (
      <main className={`${styles.page} page-shell page-shell--offset`}>
        <div className="page-shell__portfolio">
          <motion.h1 className="text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Section not found
          </motion.h1>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>{name} Portfolio | Alexandra Diz Architecture</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={absoluteUrl(canonicalPath)} />
        <meta property="og:title" content={`${name} Portfolio | Alexandra Diz Architecture`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={absoluteUrl(canonicalPath)} />
        <script type="application/ld+json">
          {JSON.stringify(serviceSchema(`${name} design`, description, canonicalPath))}
        </script>
      </Helmet>
      <main className={`${styles.page} page-shell page-shell--offset`}>
        <div className="page-shell__portfolio">
          <motion.header className={styles.header} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-white">{name}</h1>
            {category?.description && <p className="text-secondary">{category.description}</p>}
          </motion.header>
          {timelineYears.length > 1 ? (
            <motion.aside className={styles.timeline} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
              {timelineYears.map((year) => (
                <span key={year}>{year}</span>
              ))}
            </motion.aside>
          ) : null}
          <div className={styles.grid}>
            {catProjects.map((project) => {
              const cover = getCover(project);
              if (!cover) return null;

              return (
                <PortfolioProjectCard
                  key={project.id}
                  to={getCanonicalPortfolioProjectPathForCategory(category, project.slug)}
                  title={project.title}
                  image={cover}
                  eyebrow={name}
                  cityName={project.cityName}
                  year={project.year}
                />
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
