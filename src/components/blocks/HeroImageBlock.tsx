import React from 'react';
import { motion } from 'framer-motion';
import { getCoverImageStyle, normalizeImageAsset } from '../../lib/imageTransforms';

interface HeroImageBlockProps {
  data: {
    image: any;
    alt?: string;
    title?: string;
    subtitle?: string;
    crop?: {
      scale?: number;
      x?: number;
      y?: number;
    };
  };
}

export default function HeroImageBlock({ data }: HeroImageBlockProps) {
  const asset = normalizeImageAsset(typeof data.image === 'string' ? { url: data.image, alt: data.alt, crop: data.crop } : data.image);
  if (!asset?.url) return null;

  return (
    <motion.section
      className="project-hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <img
        src={asset.url}
        alt={asset.alt || data.alt || data.title || ''}
        className="project-hero-image"
        style={getCoverImageStyle(asset.crop)}
      />
      <div className="project-hero-overlay" />
      {data.title && (
        <div className="container project-hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {data.title}
          </motion.h1>
          {data.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {data.subtitle}
            </motion.p>
          )}
        </div>
      )}
    </motion.section>
  );
}
