import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface BeforeAfterBlockProps {
  data: {
    beforeImage: string;
    afterImage: string;
    beforeAlt?: string;
    afterAlt?: string;
    title?: string;
  };
}

export default function BeforeAfterBlock({ data }: BeforeAfterBlockProps) {
  const [sliderValue, setSliderValue] = useState(50);

  if (!data.beforeImage || !data.afterImage) return null;

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
          e.currentTarget.querySelector('.block-before-after-slider')?.style.setProperty('--slider', `${pct}%`);
        }
      }}
      onTouchMove={(e) => {
        const rect = e.currentTarget.querySelector('.block-before-after-slider')?.getBoundingClientRect();
        if (rect) {
          const x = e.touches[0].clientX - rect.left;
          const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
          e.currentTarget.querySelector('.block-before-after-slider')?.style.setProperty('--slider', `${pct}%`);
        }
      }}
    >
      {data.title && <h3 className="text-white" style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 20px', textAlign: 'center', fontFamily: "'GilroyExtraBold', sans-serif" }}>{data.title}</h3>}

      <div className="block-before-after-slider">
        {/* After image (background) */}
        <img src={data.afterImage} alt={data.afterAlt || 'After'} />

        {/* Before image (clipped) */}
        <div className="before-image">
          <img src={data.beforeImage} alt={data.beforeAlt || 'Before'} style={{ position: 'absolute', top: 0, left: 0, width: 'calc(100% / (var(--slider, 50%) / 100%))', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Slider line */}
        <div className="slider-line">
          <div className="slider-handle">‹›</div>
        </div>

        {/* Labels */}
        <div className="before-after-label before-after-label--before">Before</div>
        <div className="before-after-label before-after-label--after">After</div>
      </div>
    </motion.section>
  );
}
