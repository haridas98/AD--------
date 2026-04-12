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

  // Collect all before/after blocks from projects
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

  return (
    <>
      <Helmet>
        <title>Before & After — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content="Before and after transformations of our interior design projects" />
      </Helmet>

      <main className="container page-pad wide" style={{ paddingTop: '120px' }}>
        <motion.header className="page-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ color: '#fff', fontFamily: "'GilroyExtraBold', sans-serif", fontSize: '28px', fontWeight: 800, margin: '0 0 10px' }}>Before & After</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Transformation stories from our projects</p>
        </motion.header>

        <div style={{ display: 'grid', gap: '40px' }}>
          {beforeAfterItems.map((item, i) => (
            <motion.div key={`${item.projectId}-${i}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              {/* Project info */}
              <div style={{ padding: '20px 25px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <a href={`/${getCategorySlug(item.categoryId)}/${item.projectSlug}`} style={{ color: '#fff', textDecoration: 'none' }}>
                  <h3 style={{ margin: '0 0 5px', fontSize: '18px', fontWeight: 600 }}>{item.projectTitle}</h3>
                </a>
                {item.title && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>{item.title}</p>}
              </div>

              {/* Before/After slider */}
              <div style={{ position: 'relative', aspectRatio: '16/9', cursor: 'col-resize' }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                  e.currentTarget.style.setProperty('--slider', `${pct}%`);
                }}
              >
                {/* After (background) */}
                <img src={item.afterImage} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onClick={() => openLightbox([item.beforeImage, item.afterImage], 1)} />

                {/* Before (clipped) */}
                <div style={{ position: 'absolute', inset: 0, width: 'var(--slider, 50%)', overflow: 'hidden' }}>
                  <img src={item.beforeImage} alt="Before" style={{ width: `calc(100% / (var(--slider, 50%) / 100%))`, height: '100%', objectFit: 'cover' }}
                    onClick={() => openLightbox([item.beforeImage, item.afterImage], 0)} />
                </div>

                {/* Slider line */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 'var(--slider, 50%)', width: '2px', background: '#fff', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#141414' }}>‹›</div>
                </div>

                {/* Labels */}
                <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', pointerEvents: 'none' }}>Before</span>
                <span style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', pointerEvents: 'none' }}>After</span>
              </div>
            </motion.div>
          ))}
        </div>

        {beforeAfterItems.length === 0 && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '60px 0' }}>No before/after transformations available yet.</p>
        )}
      </main>

      {lightboxOpen && (
        <Lightbox images={lightboxImages} currentIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} onNavigate={setLightboxIndex} />
      )}
    </>
  );
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
