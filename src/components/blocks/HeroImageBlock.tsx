import React from 'react';
import { motion } from 'framer-motion';
import { getCoverImageStyle, normalizeImageAsset } from '../../lib/imageTransforms';
import { getPreviewImageUrl, handlePreviewFallback } from '../../lib/imageUrls';

interface HeroImageBlockProps {
  data: {
    image: any;
    alt?: string;
    title?: string;
    subtitle?: string;
    variant?: 'standard' | 'immersive';
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
  const displayTitle = shortenProjectHeroTitle(data.title || '');
  const isImmersive = data.variant === 'immersive';

  return (
    <motion.section
      className={`project-hero${isImmersive ? ' project-hero--immersive' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <img
        src={getPreviewImageUrl(asset.url)}
        alt={asset.alt || data.alt || data.title || ''}
        className="project-hero-image"
        style={getCoverImageStyle(asset.crop)}
        onError={(event) => handlePreviewFallback(event, asset.url)}
      />
      <div className="project-hero-overlay" />
      {displayTitle && (
        <div className="container project-hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {displayTitle}
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

function shortenProjectHeroTitle(title: string) {
  return title
    .replace(/\s*\([^)]*(?:CA|California|Pacifica|Palo Alto|Pleasanton|San Jose|Los Altos|Oakland|Saratoga|Redwood City|San Carlos)[^)]*\)\s*$/i, '')
    .replace(/\s*,\s*(?:California|CA)\s*$/i, '')
    .replace(/\s*,\s*(?:Pacifica|Palo Alto|Pleasanton|San Jose|Los Altos|Oakland|Saratoga|Redwood City|San Carlos|Mountain View|Foster City|San Bruno)\s*$/i, '')
    .trim();
}
