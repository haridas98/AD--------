import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getCoverImageStyle, normalizeImageAsset } from '../../lib/imageTransforms';

interface BeforeAfterBlockProps {
  data: {
    beforeImage: any;
    afterImage: any;
    beforeAlt?: string;
    afterAlt?: string;
    title?: string;
    beforeCrop?: {
      scale?: number;
      x?: number;
      y?: number;
    };
    afterCrop?: {
      scale?: number;
      x?: number;
      y?: number;
    };
  };
}

export default function BeforeAfterBlock({ data }: BeforeAfterBlockProps) {
  const [sliderValue, setSliderValue] = useState(50);
  const beforeAsset = normalizeImageAsset(typeof data.beforeImage === 'string' ? { url: data.beforeImage, alt: data.beforeAlt, crop: data.beforeCrop } : data.beforeImage);
  const afterAsset = normalizeImageAsset(typeof data.afterImage === 'string' ? { url: data.afterImage, alt: data.afterAlt, crop: data.afterCrop } : data.afterImage);

  if (!beforeAsset?.url || !afterAsset?.url) return null;

  return (
    <motion.section
      className="container block-before-after"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.querySelector('.block-before-after-slider')?.getBoundingClientRect();
        if (rect) {
          const x = e.clientX - rect.left;
          const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
          setSliderValue(pct);
          e.currentTarget.querySelector('.block-before-after-slider')?.style.setProperty('--slider', `${pct}%`);
        }
      }}
      onTouchMove={(e) => {
        const rect = e.currentTarget.querySelector('.block-before-after-slider')?.getBoundingClientRect();
        if (rect) {
          const x = e.touches[0].clientX - rect.left;
          const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
          setSliderValue(pct);
          e.currentTarget.querySelector('.block-before-after-slider')?.style.setProperty('--slider', `${pct}%`);
        }
      }}
    >
      {data.title && (
        <h3
          className="text-white"
          style={{
            fontSize: '20px',
            fontWeight: 800,
            margin: '0 0 20px',
            textAlign: 'center',
            fontFamily: "'GilroyExtraBold', sans-serif",
          }}
        >
          {data.title}
        </h3>
      )}

      <div className="block-before-after-slider" style={{ ['--slider' as string]: `${sliderValue}%` }}>
        <img src={afterAsset.url} alt={afterAsset.alt || data.afterAlt || 'After'} style={getCoverImageStyle(afterAsset.crop)} />

        <div className="before-image">
          <img
            src={beforeAsset.url}
            alt={beforeAsset.alt || data.beforeAlt || 'Before'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 'calc(100% / (var(--slider, 50%) / 100%))',
              height: '100%',
              objectFit: 'cover',
              ...getCoverImageStyle(beforeAsset.crop),
            }}
          />
        </div>

        <div className="slider-line">
          <div className="slider-handle">&lt;&gt;</div>
        </div>

        <div className="before-after-label before-after-label--before">Before</div>
        <div className="before-after-label before-after-label--after">After</div>
      </div>
    </motion.section>
  );
}
