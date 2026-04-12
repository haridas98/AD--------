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
      className="before-after-block"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{
        maxWidth: 'var(--content-max-width)',
        margin: '0 auto',
        padding: '40px 15px',
      }}
    >
      {data.title && (
        <h3
          style={{
            fontFamily: "'GilroyExtraBold', sans-serif",
            fontSize: '20px',
            fontWeight: 800,
            margin: '0 0 20px',
            color: 'var(--text-primary)',
            textAlign: 'center',
          }}
        >
          {data.title}
        </h3>
      )}

      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/10',
          overflow: 'hidden',
          borderRadius: '4px',
          cursor: 'col-resize',
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
          setSliderValue(pct);
        }}
        onTouchMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.touches[0].clientX - rect.left;
          const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
          setSliderValue(pct);
        }}
      >
        {/* After image (background) */}
        <img
          src={data.afterImage}
          alt={data.afterAlt || 'After'}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Before image (clipped) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${sliderValue}%`,
            overflow: 'hidden',
          }}
        >
          <img
            src={data.beforeImage}
            alt={data.beforeAlt || 'Before'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${100 / (sliderValue / 100)}%`,
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Slider line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${sliderValue}%`,
            width: '2px',
            background: '#fff',
            transform: 'translateX(-50%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: '#141414',
            }}
          >
            ‹›
          </div>
        </div>

        {/* Labels */}
        <div
          style={{
            position: 'absolute',
            bottom: '15px',
            left: '15px',
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            fontFamily: "'GilroyLight', sans-serif",
          }}
        >
          Before
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '15px',
            right: '15px',
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            fontFamily: "'GilroyLight', sans-serif",
          }}
        >
          After
        </div>
      </div>
    </motion.section>
  );
}
