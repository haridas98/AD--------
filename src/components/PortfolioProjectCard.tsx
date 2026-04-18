import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PortfolioProjectCard.module.scss';

interface PortfolioProjectCardProps {
  to: string;
  title: string;
  image: string;
  eyebrow?: string;
  cityName?: string;
  year?: number | string;
}

export function PortfolioProjectCard({ to, title, image, eyebrow, cityName, year }: PortfolioProjectCardProps) {
  return (
    <Link to={to} className={styles.card} data-portfolio-card>
      <img src={image} alt={title} className={styles.image} loading="lazy" />
      <div className={styles.overlay}>
        {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
        <h3 className={styles.title}>{title}</h3>
        {(cityName || year) ? <p className={styles.meta}>{[cityName, year].filter(Boolean).join(' • ')}</p> : null}
      </div>
    </Link>
  );
}
