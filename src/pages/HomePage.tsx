import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import Lightbox from '../components/Lightbox';

export default function HomePage() {
  const { categories, projects, site } = useAppStore();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
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

  function getAllImages(p: any) {
    const c = typeof p.content === 'string' ? JSON.parse(p.content) : p.content;
    const imgs: string[] = [];
    c.forEach((b: any) => {
      if (b.type === 'heroImage' && b.data?.image) imgs.push(b.data.image);
      if (b.type === 'imageGrid' && b.data?.images) {
        b.data.images.forEach((img: any) => {
          const url = typeof img === 'string' ? img : img.url;
          if (url) imgs.push(url);
        });
      }
    });
    return imgs;
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

  const openLightbox = (imgs: string[], idx: number) => {
    setLightboxImages(imgs);
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

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

      {/* Category Sections — Masonry Grid */}
      <section style={{ padding: '50px 15px 80px' }}>
        {categories.map((category) => {
          const catProjects = projects.filter((p) => p.categoryId === category.id && p.isPublished);
          if (!catProjects.length) return null;

          // Collect all images from projects in this category for masonry
          const masonryImages: { url: string; projectId: string; projectTitle: string }[] = [];
          catProjects.slice(0, 6).forEach((p) => {
            const imgs = getAllImages(p);
            imgs.forEach((img) => masonryImages.push({ url: img, projectId: p.id, projectTitle: p.title }));
          });

          return (
            <motion.div key={category.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ marginBottom: '60px' }}>
              {/* Section header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 5px' }}>
                <h2 style={{ color: '#fff', fontFamily: "'GilroyExtraBold', sans-serif", fontSize: '20px', fontWeight: 700, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{category.name}</h2>
                <Link to={getCategorySlug(category.id)} className="btn-see-more">
                  <span>See more {category.name.toLowerCase()}</span>
                  <svg width="20" height="10" viewBox="0 0 20 10" fill="none"><path d="M1 5h18M15 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              </div>

              {/* Masonry Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {masonryImages.slice(0, 6).map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                    onClick={() => openLightbox(masonryImages.slice(0, 6).map(x => x.url), i)}
                  >
                    <img
                      src={img.url}
                      alt={img.projectTitle}
                      loading="lazy"
                      style={{ width: '100%', height: i < 2 ? '350px' : '280px', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.3s', display: 'flex', alignItems: 'flex-end', padding: '15px' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                    >
                      <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, opacity: 0, transition: 'opacity 0.3s' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                      >{img.projectTitle}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox images={lightboxImages} currentIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} onNavigate={setLightboxIndex} />
      )}
    </>
  );
}
