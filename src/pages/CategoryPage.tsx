import React from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { PortfolioProjectCard } from '../components/PortfolioProjectCard';
import styles from './CategoryPage.module.scss';

const CATEGORY_NAMES: Record<string, string> = {
  kitchens: 'Kitchens',
  'full-house-remodeling': 'Full House Remodeling',
  bathrooms: 'Bathrooms',
  adu1: 'ADU',
  'projects-before-and-after': 'Before & After',
  fireplaces: 'Fireplaces',
};

export default function CategoryPage() {
  const location = useLocation();
  const { projects, site } = useAppStore();

  const catSlug = location.pathname.split('/')[1];
  const category = useAppStore.getState().categories.find((c) => c.slug === catSlug || c.id === catSlug);
  const name = CATEGORY_NAMES[catSlug] || category?.name || catSlug;

  const catProjects = projects.filter((p) => p.categoryId === (category?.id || catSlug) && p.isPublished);

  function getCover(p: any) {
    const c = typeof p.content === 'string' ? JSON.parse(p.content) : p.content;
    return c?.find((b: any) => b.type === 'heroImage')?.data?.image || '';
  }

  if (!catProjects.length) {
    return (
      <main className={`${styles.page} page-shell page-shell--offset`}>
        <div className="page-shell__portfolio">
          <motion.h1 className="text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Section not found</motion.h1>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>{name} — {site?.name || 'Alexandra Diz'}</title>
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
                  to={`/${catSlug}/${project.slug}`}
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
