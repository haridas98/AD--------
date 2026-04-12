import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

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

  // Extract category from path: /kitchens, /bathrooms, etc.
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
      <main className="container" style={{ padding: '120px 15px 60px' }}>
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#fff' }}>Section not found</motion.h1>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>{name} — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={`${name} projects by Alexandra Diz`} />
      </Helmet>
      <main className="container" style={{ padding: '120px 15px 60px' }}>
        <motion.header className="page-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ color: '#fff' }}>{name}</h1>
          {category?.description && <p style={{ color: 'rgba(255,255,255,0.7)' }}>{category.description}</p>}
        </motion.header>
        <div className="cards-grid">
          {catProjects.map((project, i) => (
            <motion.article key={project.id} className="project-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
              <Link to={`/${catSlug}/${project.slug}`} className="project-image-wrap">
                {getCover(project) && <img src={getCover(project)} alt={project.title} loading="lazy" />}
              </Link>
              <div className="project-body"><h3>{project.title}</h3></div>
            </motion.article>
          ))}
        </div>
      </main>
    </>
  );
}
