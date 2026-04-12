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
      className="block-typography"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      {data.title && <h2>{data.title}</h2>}
      <p style={{ fontSize: sizeMap[data.size || 'md'], whiteSpace: 'pre-wrap' }}>{data.content}</p>
    </motion.section>
  );
}
