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
        className={`block-image-grid block-image-grid--${cols}`}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {data.images.map((img, i) => (
          <motion.div
            key={i}
            className="block-image-grid-item"
            onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <img src={img.url} alt={img.alt || ''} loading="lazy" className={cols === 1 ? 'block-image-grid-item--full' : ''} />
            <div className="block-image-grid-item-overlay" />
          </motion.div>
        ))}
      </motion.section>

      {lightboxOpen && (
        <Lightbox images={images} currentIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} onNavigate={setLightboxIndex} />
      )}
    </>
  );
}
