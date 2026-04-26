import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Lightbox from '../Lightbox';
import { normalizeImageAsset } from '../../lib/imageTransforms';
import { getPreviewImageUrl, handlePreviewFallback } from '../../lib/imageUrls';

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

  const normalizedImages = data.images.map((img: any) => normalizeImageAsset(img)).filter((img) => img?.url);
  if (!normalizedImages.length) return null;

  const images = normalizedImages.map((img) => img!.url);
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
        {normalizedImages.map((img, i) => (
          <motion.div
            key={i}
            className={`block-image-grid-item${cols === 1 ? ' block-image-grid-item--full' : ''}`}
            onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={getPreviewImageUrl(img!.url)}
              alt={img!.alt || ''}
              loading="lazy"
              onError={(event) => handlePreviewFallback(event, img!.url)}
            />
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
