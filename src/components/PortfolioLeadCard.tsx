import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PortfolioLeadCard.module.scss';

interface PortfolioLeadCardProps {
  to: string;
  title: string;
  image: string;
  categoryName: string;
  cityName?: string;
  year?: number | string;
}

export function PortfolioLeadCard({ to, title, image, categoryName, cityName, year }: PortfolioLeadCardProps) {
  return (
    <Link to={to} className={styles.card} data-home-lead>
      <img src={image} alt={title} className={styles.image} loading="lazy" />
      <div className={styles.overlay}>
        <span className={styles.eyebrow}>{categoryName}</span>
        <h3 className={styles.title}>{title}</h3>
        {(cityName || year) ? <p className={styles.meta}>{[cityName, year].filter(Boolean).join(' • ')}</p> : null}
      </div>
    </Link>
  );
}
