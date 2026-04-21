import React from 'react';
import { motion } from 'framer-motion';
import { getCoverImageStyle, normalizeImageAsset } from '../../lib/imageTransforms';

interface SideBySideBlockProps {
  data: {
    text: string;
    image: any;
    alt?: string;
    imagePosition?: 'left' | 'right';
    title?: string;
    crop?: {
      scale?: number;
      x?: number;
      y?: number;
    };
  };
}

export default function SideBySideBlock({ data }: SideBySideBlockProps) {
  const asset = normalizeImageAsset(typeof data.image === 'string' ? { url: data.image, alt: data.alt, crop: data.crop } : data.image);
  if (!data.text && !asset?.url) return null;

  const isImageLeft = data.imagePosition !== 'right';

  return (
    <motion.section
      className={`container block-side-by-side ${!isImageLeft ? 'block-side-by-side--reverse' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {asset?.url && (
        <div className="block-side-by-side-image">
          <img src={asset.url} alt={asset.alt || data.alt || data.title || ''} style={getCoverImageStyle(asset.crop)} />
        </div>
      )}
      {data.text && (
        <div className="block-side-by-side-content">
          {data.title && <h3 className="text-white">{data.title}</h3>}
          <p style={{ whiteSpace: 'pre-wrap' }}>{data.text}</p>
        </div>
      )}
    </motion.section>
  );
}
