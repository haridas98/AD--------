import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Lightbox from '../Lightbox';

interface ImageGridBlockProps {
  data: {
    images: Array<{ url: string; alt?: string }>;
    columns?: 1 | 2 | 3;
  };
}

export default function ImageGridBlock({ data }: ImageGridBlockProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!data.images?.length) return null;

  const images = data.images?.map((img: any) => typeof img === 'string' ? img : img.url) || [];
  const cols = data.columns || 2;

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'grid',
          gridTemplateColumns: cols === 1 ? '1fr' : cols === 2 ? '1fr 1fr' : '1fr 1fr 1fr',
          gap: '8px',
          padding: '0 15px 60px',
          maxWidth: 'var(--content-max-width)',
          margin: '0 auto',
        }}
      >
        {data.images.map((img, i) => (
          <motion.div
            key={i}
            onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
            style={{ cursor: 'pointer', overflow: 'hidden', borderRadius: '4px', position: 'relative' }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={img.url}
              alt={img.alt || ''}
              loading="lazy"
              style={{ width: '100%', height: cols === 1 ? 'auto' : '400px', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0)', transition: 'background 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0)')} />
          </motion.div>
        ))}
      </motion.section>

      {lightboxOpen && (
        <Lightbox images={images} currentIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} onNavigate={setLightboxIndex} />
      )}
    </>
  );
}
