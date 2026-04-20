import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './PortfolioProjectCard.module.scss';

interface PortfolioProjectCardProps {
  to: string;
  title: string;
  image: string;
  eyebrow?: string;
  cityName?: string;
  year?: number | string;
}

const MotionLink = motion(Link);

export function PortfolioProjectCard({ to, title, image, eyebrow, cityName, year }: PortfolioProjectCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionLink
      to={to}
      className={styles.card}
      data-portfolio-card
      whileHover={shouldReduceMotion ? undefined : { y: -4, scale: 1.006 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.994 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <img src={image} alt={title} className={styles.image} loading="lazy" />
      <div className={styles.overlay}>
        {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
        <h3 className={styles.title}>{title}</h3>
        {(cityName || year) ? <p className={styles.meta}>{[cityName, year].filter(Boolean).join(' • ')}</p> : null}
      </div>
    </MotionLink>
  );
}
