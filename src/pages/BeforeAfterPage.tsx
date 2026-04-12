import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import Lightbox from '../components/Lightbox';

export default function BeforeAfterPage() {
  const { projects, site } = useAppStore();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const beforeAfterItems = projects.flatMap((project) => {
    const content = typeof project.content === 'string' ? JSON.parse(project.content) : project.content;
    return content
      .filter((b: any) => b.type === 'beforeAfter')
      .map((b: any) => ({
        projectId: project.id,
        projectTitle: project.title,
        projectSlug: project.slug,
        categoryId: project.categoryId,
        ...b.data,
      }));
  });

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

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

  return (
    <>
      <Helmet>
        <title>Before & After — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content="Before and after transformations of our interior design projects" />
      </Helmet>

      <main className="container before-after-page">
        <motion.header className="page-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-white">Before & After</h1>
          <p className="text-muted">Transformation stories from our projects</p>
        </motion.header>

        <div className="before-after-list">
          {beforeAfterItems.map((item, i) => (
            <motion.div key={`${item.projectId}-${i}`} className="before-after-item" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              style={{ marginBottom: '40px' }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.querySelector('.before-after-slider')?.getBoundingClientRect();
                if (rect) {
                  const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                  e.currentTarget.querySelector('.before-after-slider')?.style.setProperty('--slider', `${pct}%`);
                }
              }}
            >
              {/* Project info */}
              <div className="before-after-info">
                <a href={`/${getCategorySlug(item.categoryId)}/${item.projectSlug}`}>
                  <h3>{item.projectTitle}</h3>
                </a>
                {item.title && <p>{item.title}</p>}
              </div>

              {/* Before/After slider */}
              <div className="before-after-slider">
                {/* After (background) */}
                <img src={item.afterImage} alt="After" onClick={() => openLightbox([item.beforeImage, item.afterImage], 1)} />

                {/* Before (clipped) */}
                <div className="before-image">
                  <img src={item.beforeImage} alt="Before" onClick={() => openLightbox([item.beforeImage, item.afterImage], 0)} />
                </div>

                {/* Slider line */}
                <div className="slider-line">
                  <div className="slider-handle">‹›</div>
                </div>

                {/* Labels */}
                <span className="before-after-label before-after-label--before">Before</span>
                <span className="before-after-label before-after-label--after">After</span>
              </div>
            </motion.div>
          ))}
        </div>

        {beforeAfterItems.length === 0 && (
          <p className="text-muted" style={{ textAlign: 'center', padding: '60px 0' }}>No before/after transformations available yet.</p>
        )}
      </main>

      {lightboxOpen && (
        <Lightbox images={lightboxImages} currentIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} onNavigate={setLightboxIndex} />
      )}
    </>
  );
}
