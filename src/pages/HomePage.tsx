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
      <section className="hero-slider" style={{ position: 'relative', height: '70vh', overflow: 'hidden', background: '#141414' }}>
        <AnimatePresence mode="wait">
          {featured.length > 0 && (
            <motion.div key={slide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} style={{ position: 'absolute', inset: 0 }}>
              <img src={getCover(featured[slide])} alt={featured[slide].title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(20,20,20,0.3) 0%, rgba(20,20,20,0.7) 100%)' }} />
              <div className="container" style={{ position: 'absolute', bottom: '50px', left: 0, right: 0, zIndex: 2, color: '#fff' }}>
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ fontFamily: "'GilroyExtraBold', sans-serif", fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 800, margin: '0 0 8px' }}>{featured[slide].title}</motion.h1>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <Link to={getProjectLink(featured[slide])} className="btn-primary">View Project</Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {featured.length > 1 && (
          <>
            <div style={{ position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 3 }}>
              {featured.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} style={{ width: slide === i ? '24px' : '8px', height: '8px', borderRadius: '4px', background: slide === i ? '#fff' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease' }} />
              ))}
            </div>
            <button onClick={() => setSlide((s) => (s - 1 + featured.length) % featured.length)} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', zIndex: 3, width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <button onClick={() => setSlide((s) => (s + 1) % featured.length)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', zIndex: 3, width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          </>
        )}
      </section>

      {/* Category Sections — Project Cards */}
      <section className="container home-sections" style={{ padding: '60px 15px' }}>
        {categories.map((category) => {
          const catProjects = projects.filter((p) => p.categoryId === category.id && p.isPublished);
          if (!catProjects.length) return null;
          return (
            <motion.div key={category.id} className="section-block" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div className="section-head">
                <h2 style={{ color: '#fff', fontFamily: "'GilroyExtraBold', sans-serif", fontSize: '20px', fontWeight: 700, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{category.name}</h2>
                <Link to={getCategorySlug(category.id)} className="btn-see-more">
                  <span>See more {category.name.toLowerCase()}</span>
                  <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><path d="M1 6h22M18 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              </div>
              <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {catProjects.slice(0, 6).map((project, idx) => {
                  const cover = getCover(project);
                  return (
                    <motion.article key={project.id} className="project-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }} whileHover={{ y: -4 }}>
                      <Link to={getProjectLink(project)} className="project-image-wrap" style={{ aspectRatio: '4/5' }}>
                        {cover && <img src={cover} alt={project.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </Link>
                      <div className="project-body" style={{ padding: '12px 0 0' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{project.title}</h3>
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
