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
      className={`block-side-by-side ${!isImageLeft ? 'block-side-by-side--reverse' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {data.image && (
        <div className="block-side-by-side-image">
          <img src={data.image} alt={data.alt || data.title || ''} />
        </div>
      )}
      {data.text && (
        <div className="block-side-by-side-content">
          {data.title && <h3 className="text-white">{data.title}</h3>}
          <p style={{ whiteSpace: 'pre-wrap' }}>{data.text}</p>
        </div>
      )}
    </motion.section>
  );
}
