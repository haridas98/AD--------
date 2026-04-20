import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { fadeIn, heroBody, heroTitle, slowTransition, staggerContainer } from '../../lib/motion';

interface HeroImageBlockProps {
  data: {
    image: string;
    alt?: string;
    title?: string;
    subtitle?: string;
  };
}

export default function HeroImageBlock({ data }: HeroImageBlockProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!data.image) return null;

  return (
    <motion.section
      className="project-hero"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      <motion.img
        src={data.image}
        alt={data.alt || data.title || ''}
        className="project-hero-image"
        initial={shouldReduceMotion ? false : { scale: 1 }}
        animate={shouldReduceMotion ? undefined : { scale: 1.05 }}
        transition={shouldReduceMotion ? undefined : slowTransition}
      />
      <div className="project-hero-overlay" />
      {data.title && (
        <motion.div
          className="container project-hero-content"
          variants={staggerContainer(0.12, 0.08)}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={heroTitle}
          >
            {data.title}
          </motion.h1>
          {data.subtitle && (
            <motion.p
              variants={heroBody}
            >
              {data.subtitle}
            </motion.p>
          )}
        </motion.div>
      )}
    </motion.section>
  );
}
