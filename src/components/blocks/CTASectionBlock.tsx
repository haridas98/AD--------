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
      className={`block-cta ${data.align === 'left' ? 'block-cta--left' : data.align === 'right' ? 'block-cta--right' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {data.title && <h2>{data.title}</h2>}
      {data.text && <p>{data.text}</p>}
      {data.buttonText && (
        <a href={data.buttonLink || '/contact'} className="btn-primary" style={{ display: 'inline-flex' }}>
          {data.buttonText}
        </a>
      )}
    </motion.section>
  );
}
