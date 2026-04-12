import React from 'react';
import { motion } from 'framer-motion';

interface SideBySideBlockProps {
  data: {
    text: string;
    image: string;
    alt?: string;
    imagePosition?: 'left' | 'right';
    title?: string;
  };
}

export default function SideBySideBlock({ data }: SideBySideBlockProps) {
  if (!data.text && !data.image) return null;

  const isImageLeft = data.imagePosition !== 'right';

  return (
    <motion.section
      className="side-by-side-block"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex',
        flexDirection: isImageLeft ? 'row' : 'row-reverse',
        gap: '30px',
        alignItems: 'center',
        maxWidth: 'var(--content-max-width)',
        margin: '0 auto',
        padding: '40px 15px',
      }}
    >
      {data.image && (
        <div style={{ flex: '0 0 50%' }}>
          <img
            src={data.image}
            alt={data.alt || data.title || ''}
            style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
          />
        </div>
      )}
      {data.text && (
        <div style={{ flex: '0 0 50%' }}>
          {data.title && (
            <h3
              style={{
                fontFamily: "'GilroyExtraBold', sans-serif",
                fontSize: '20px',
                fontWeight: 800,
                margin: '0 0 15px',
                color: 'var(--text-primary)',
              }}
            >
              {data.title}
            </h3>
          )}
          <p
            style={{
              fontFamily: "'GilroyLight', sans-serif",
              fontSize: '14px',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {data.text}
          </p>
        </div>
      )}
    </motion.section>
  );
}
