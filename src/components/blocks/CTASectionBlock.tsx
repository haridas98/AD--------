import React from 'react';
import { motion } from 'framer-motion';

interface CTASectionBlockProps {
  data: {
    title?: string;
    text?: string;
    buttonText: string;
    buttonLink?: string;
    align?: 'left' | 'center' | 'right';
  };
}

export default function CTASectionBlock({ data }: CTASectionBlockProps) {
  return (
    <motion.section
      className="cta-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{
        maxWidth: 'var(--content-max-width)',
        margin: '0 auto',
        padding: '60px 15px',
        textAlign: data.align || 'center',
      }}
    >
      {data.title && (
        <h2
          style={{
            fontFamily: "'GilroyExtraBold', sans-serif",
            fontSize: '28px',
            fontWeight: 800,
            margin: '0 0 15px',
            color: 'var(--text-primary)',
          }}
        >
          {data.title}
        </h2>
      )}
      {data.text && (
        <p
          style={{
            fontFamily: "'GilroyLight', sans-serif",
            fontSize: '14px',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            margin: '0 0 30px',
          }}
        >
          {data.text}
        </p>
      )}
      {data.buttonText && (
        <a
          href={data.buttonLink || '/contact'}
          className="btn-primary"
          style={{ display: 'inline-flex' }}
        >
          {data.buttonText}
        </a>
      )}
    </motion.section>
  );
}
