import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Lightbox from '../Lightbox';
import { normalizeImageAsset } from '../../lib/imageTransforms';
import { getPreviewImageUrl, handlePreviewFallback } from '../../lib/imageUrls';

type PhotoSequenceItem = {
  layout?: 'wide' | 'pair';
  images?: any[];
};

interface PhotoSequenceBlockProps {
  data: {
    items?: PhotoSequenceItem[];
  };
}

export default function PhotoSequenceBlock({ data }: PhotoSequenceBlockProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const rows = (data.items || [])
    .map((item) => ({
      layout: item.layout === 'pair' ? 'pair' : 'wide',
      images: (item.images || []).map((image) => normalizeImageAsset(image)).filter(Boolean),
    }))
    .filter((item) => item.images.length);

  const originals = useMemo(
    () => rows.flatMap((row) => row.images.map((image) => image!.url)),
    [rows],
  );

  if (!rows.length) return null;

  let imageOffset = 0;

  return (
    <>
      <motion.section
        className="block-photo-sequence"
        data-project-block
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {rows.map((row, rowIndex) => {
          const startIndex = imageOffset;
          imageOffset += row.images.length;

          return (
            <div key={rowIndex} className={`block-photo-sequence-row block-photo-sequence-row--${row.layout}`}>
              {row.images.slice(0, row.layout === 'pair' ? 2 : 1).map((image, imageIndex) => (
                <button
                  key={`${image!.url}-${imageIndex}`}
                  type="button"
                  className="block-photo-sequence-item"
                  onClick={() => {
                    setLightboxIndex(startIndex + imageIndex);
                    setLightboxOpen(true);
                  }}
                >
                  <img
                    src={getPreviewImageUrl(image!.url)}
                    alt={image!.alt || ''}
                    loading="lazy"
                    onError={(event) => handlePreviewFallback(event, image!.url)}
                  />
                </button>
              ))}
            </div>
          );
        })}
      </motion.section>

      {lightboxOpen ? (
        <Lightbox images={originals} currentIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} onNavigate={setLightboxIndex} />
      ) : null}
    </>
  );
}
