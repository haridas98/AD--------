import React from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { PortfolioProjectCard } from '../components/PortfolioProjectCard';
import {
  getCanonicalPortfolioProjectPathForCategory,
  resolvePortfolioSectionFromPathname,
} from '../lib/portfolioRoutes';
import styles from './CategoryPage.module.scss';

export default function CategoryPage() {
  const location = useLocation();
  const { categories, projects, site } = useAppStore();

  const section = resolvePortfolioSectionFromPathname(location.pathname);
  const category = categories.find((item) => item.slug === section?.legacySlug || item.id === section?.legacySlug);
  const name = category?.name || section?.label || 'Projects';

  const catProjects = projects.filter(
    (project) => project.categoryId === (category?.id || section?.legacySlug) && project.isPublished,
  );

  function getCover(project: any) {
    const content = typeof project.content === 'string' ? JSON.parse(project.content) : project.content;
    return content?.find((block: any) => block.type === 'heroImage')?.data?.image || '';
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
        <title>{name} - {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={`${name} projects by Alexandra Diz`} />
      </Helmet>
      <main className={`${styles.page} page-shell page-shell--offset`}>
        <div className="page-shell__portfolio">
          <motion.header className={styles.header} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-white">{name}</h1>
            {category?.description && <p className="text-secondary">{category.description}</p>}
          </motion.header>
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
