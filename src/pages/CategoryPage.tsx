import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, projects, site } = useAppStore();
  const category = categories.find((c) => c.slug === slug);
  const catProjects = projects.filter((p) => p.categoryId === category?.id && p.isPublished);

  if (!category) return <main className="container page-pad"><motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#fff' }}>Section not found</motion.h1></main>;

  const getCover = (p: any) => { const c = typeof p.content === 'string' ? JSON.parse(p.content) : p.content; return c?.find((b: any) => b.type === 'heroImage')?.data?.image || ''; };

  return (
    <>
      <Helmet><title>{category.name} — {site?.name || 'Alexandra Diz'}</title><meta name="description" content={`${category.name} projects`} /></Helmet>
      <main className="container" style={{ padding: '120px 15px 60px' }}>
        <motion.header className="page-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ color: '#fff' }}>{category.name}</h1>
          {category.description && <p style={{ color: 'rgba(255,255,255,0.7)' }}>{category.description}</p>}
        </motion.header>
        <div className="cards-grid">
          {catProjects.map((project, i) => (
            <motion.article key={project.id} className="project-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
              <Link to={`/project/${project.slug}`} className="project-image-wrap">{getCover(project) && <img src={getCover(project)} alt={project.title} loading="lazy" />}</Link>
              <div className="project-body"><h3>{project.title}</h3></div>
            </motion.article>
          ))}
        </div>
      </main>
    </>
  );
}
