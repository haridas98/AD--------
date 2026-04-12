import React from 'react';
import { motion } from 'framer-motion';

interface TypographyBlockProps {
  data: {
    title?: string;
    content: string;
    align?: 'left' | 'center' | 'right';
    size?: 'sm' | 'md' | 'lg';
  };
}

export default function TypographyBlock({ data }: TypographyBlockProps) {
  if (!data.content) return null;

  const sizeMap = { sm: '14px', md: '16px', lg: '18px' };

  return (
    <motion.section
      className="project-description"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      style={{
        maxWidth: 'var(--content-max-width)',
        margin: '0 auto',
        padding: '0 15px 40px',
        textAlign: data.align || 'left',
      }}
    >
      {data.title && (
        <h2
          style={{
            fontFamily: "'GilroyExtraBold', sans-serif",
            fontSize: '22px',
            fontWeight: 800,
            margin: '0 0 15px',
            color: 'var(--text-primary)',
          }}
        >
          {data.title}
        </h2>
      )}
      <p
        style={{
          fontFamily: "'GilroyLight', sans-serif",
          fontSize: sizeMap[data.size || 'md'],
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          margin: 0,
          whiteSpace: 'pre-wrap',
        }}
      >
        {data.content}
      </p>
    </motion.section>
  );
}
