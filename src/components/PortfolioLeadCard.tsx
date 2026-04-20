import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './PortfolioLeadCard.module.scss';

interface PortfolioLeadCardProps {
  to: string;
  title: string;
  image: string;
  categoryName: string;
  cityName?: string;
  year?: number | string;
}

const MotionLink = motion(Link);

export function PortfolioLeadCard({ to, title, image, categoryName, cityName, year }: PortfolioLeadCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionLink
      to={to}
      className={styles.card}
      data-home-lead
      whileHover={shouldReduceMotion ? undefined : { y: -6, scale: 1.004 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.995 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <img src={image} alt={title} className={styles.image} loading="lazy" />
      <div className={styles.overlay}>
        <span className={styles.eyebrow}>{categoryName}</span>
        <h3 className={styles.title}>{title}</h3>
        {(cityName || year) ? <p className={styles.meta}>{[cityName, year].filter(Boolean).join(' • ')}</p> : null}
      </div>
    </MotionLink>
  );
}
