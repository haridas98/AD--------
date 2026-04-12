import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export default function HomePage() {
  const { categories, projects, site } = useAppStore();
  const [slide, setSlide] = useState(0);

  const featured = projects.filter((p) => p.isFeatured && p.isPublished);

  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, [featured.length]);

  function getCover(p: any) {
    const c = typeof p.content === 'string' ? JSON.parse(p.content) : p.content;
    return c?.find((b: any) => b.type === 'heroImage')?.data?.image || '';
  }

  function getCategorySlug(catId: string) {
    const map: Record<string, string> = {
      kitchens: '/kitchens',
      'full-house-remodeling': '/full-house-remodeling',
      bathrooms: '/bathrooms',
      adu1: '/adu1',
      'projects-before-and-after': '/projects-before-and-after',
      fireplaces: '/fireplaces',
    };
    return map[catId] || `/${catId}`;
  }

  function getProjectLink(project: any) {
    return `${getCategorySlug(project.categoryId)}/${project.slug}`;
  }

  return (
    <>
      <Helmet>
        <title>{site?.name || 'Alexandra Diz'} — Interior Architecture & Remodeling</title>
        <meta name="description" content="Refined California interiors with practical planning, material clarity, and timeless detail." />
      </Helmet>

      {/* Hero Slider */}
      <section className="hero-slider" onClick={(e) => {
        if (featured.length < 2) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width * 0.3) setSlide((s) => (s - 1 + featured.length) % featured.length);
        else if (x > rect.width * 0.7) setSlide((s) => (s + 1) % featured.length);
      }}>
        <AnimatePresence mode="wait">
          {featured.length > 0 && (
            <motion.div key={slide} className="hero-slider-slide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
              <img src={getCover(featured[slide])} alt={featured[slide].title} />
              <div className="hero-slider-overlay" />
              <div className="container hero-slider-content">
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>{featured[slide].title}</motion.h1>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <Link to={getProjectLink(featured[slide])} className="btn-primary" onClick={(e) => e.stopPropagation()}>View Project</Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {featured.length > 1 && (
          <div className="hero-slider-dots">
            {featured.map((_, i) => (
              <button key={i} className={`hero-slider-dot${slide === i ? ' active' : ''}`} onClick={(e) => { e.stopPropagation(); setSlide(i); }} />
            ))}
          </div>
        )}
      </section>

      {/* Category Sections — Project Cards */}
      <section className="container home-sections">
        {categories.map((category) => {
          const catProjects = projects.filter((p) => p.categoryId === category.id && p.isPublished);
          if (!catProjects.length) return null;
          return (
            <motion.div key={category.id} className="section-block" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div className="section-head">
                <h2>{category.name}</h2>
                <Link to={getCategorySlug(category.id)} className="btn-see-more">
                  <span>See more {category.name.toLowerCase()}</span>
                  <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><path d="M1 6h22M18 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </div>
              <div className="cards-grid">
                {catProjects.slice(0, 8).map((project, idx) => {
                  const cover = getCover(project);
                  return (
                    <motion.article key={project.id} className="project-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }} whileHover={{ y: -4 }}>
                      <Link to={getProjectLink(project)} className="project-image-wrap">
                        {cover && <img src={cover} alt={project.title} loading="lazy" />}
                      </Link>
                      <div className="project-body">
                        <h3>{project.title}</h3>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </section>
    </>
  );
}
