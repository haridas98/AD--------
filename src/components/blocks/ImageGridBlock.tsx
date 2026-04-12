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

  const images = data.images.map((img) => img.url);

  return (
    <>
      <motion.section
        className="gallery-grid"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${data.columns || 2}, 1fr)`,
          gap: '15px',
          padding: '0 15px',
          maxWidth: 'var(--content-max-width)',
          margin: '0 auto',
        }}
      >
        {data.images.map((img, i) => (
          <motion.img
            key={i}
            src={img.url}
            alt={img.alt || ''}
            loading="lazy"
            onClick={() => {
              setLightboxIndex(i);
              setLightboxOpen(true);
            }}
            style={{ cursor: 'pointer', width: '100%', height: 'auto' }}
            whileHover={{ scale: 1.02, opacity: 0.9 }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </motion.section>

      {lightboxOpen && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
