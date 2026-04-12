import React from 'react';
import { motion } from 'framer-motion';

interface HeroImageBlockProps {
  data: {
    image: string;
    alt?: string;
    title?: string;
    subtitle?: string;
  };
}

export default function HeroImageBlock({ data }: HeroImageBlockProps) {
  if (!data.image) return null;

  return (
    <motion.section
      className="project-hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <img
        src={data.image}
        alt={data.alt || data.title || ''}
        className="project-hero-image"
      />
      <div className="project-hero-overlay" />
      {data.title && (
        <div className="container project-hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {data.title}
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
