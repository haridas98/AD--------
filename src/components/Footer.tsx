import React from 'react';
import { Link } from 'react-router-dom';
import type { SiteInfo } from '../types';
import { portfolioHeaderItems } from '../lib/portfolioRoutes';
import styles from './Footer.module.scss';

const FOOTER_LINKS = [
  ...portfolioHeaderItems,
  { name: 'Before & After', href: '/projects-before-and-after' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
];

const SOCIAL_LINKS = [
  {
    key: 'instagram',
    label: 'Instagram',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>,
  },
  {
    key: 'pinterest',
    label: 'Pinterest',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.02 0C5.39 0 .25 4.91.25 11.27c0 4.83 3.05 8.97 7.35 10.5-.1-.9-.19-2.28.04-3.27.21-.89 1.37-5.67 1.37-5.67s-.35-.7-.35-1.73c0-1.62.94-2.83 2.11-2.83 1 0 1.48.75 1.48 1.65 0 1-.64 2.5-.97 3.89-.28 1.16.58 2.1 1.72 2.1 2.06 0 3.64-2.17 3.64-5.3 0-2.77-1.99-4.71-4.83-4.71-3.29 0-5.22 2.47-5.22 5.02 0 .99.38 2.06.86 2.64.09.11.11.21.08.33-.09.36-.28 1.16-.32 1.32-.05.21-.17.26-.39.16-1.46-.68-2.37-2.82-2.37-4.54 0-3.69 2.68-7.08 7.73-7.08 4.06 0 7.22 2.89 7.22 6.76 0 4.04-2.55 7.29-6.08 7.29-1.19 0-2.3-.62-2.68-1.35l-.73 2.78c-.26 1.02-.98 2.29-1.46 3.07 1.1.34 2.27.52 3.49.52 6.63 0 11.77-4.91 11.77-11.27C23.75 4.91 18.61 0 12.02 0z" /></svg>,
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3.01 3.01 0 0 0-2.12-2.13C19.5 3.56 12 3.56 12 3.56s-7.5 0-9.38.51A3.01 3.01 0 0 0 .5 6.2 31.47 31.47 0 0 0 0 12a31.47 31.47 0 0 0 .5 5.8 3.01 3.01 0 0 0 2.12 2.13c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.01 3.01 0 0 0 2.12-2.13A31.47 31.47 0 0 0 24 12a31.47 31.47 0 0 0-.5-5.8zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" /></svg>,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8H6v4h3v12h5V12h3.64L18 8h-4V6.33C14 5.38 14.19 5 15.12 5H18V0h-3.81C10.6 0 9 1.58 9 4.62V8z" /></svg>,
  },
  {
    key: 'houzz',
    label: 'Houzz',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21.5V2.5l7.5 4.15v6.49L3 9.02v12.48zm9.5 0V7.81L21 12.5v9h-8.5zm0-15.99V2.5L21 7.2v3.01l-8.5-4.7z" /></svg>,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 1.5c.36 3.08 2.08 4.92 5.06 5.12v4.08a8.62 8.62 0 0 1-5.03-1.55v6.86c0 4.43-3.01 6.49-6.14 6.49-3.52 0-6.15-2.68-6.15-6.02 0-3.9 3.05-6.27 7.21-5.78v4.14c-1.6-.25-3.03.48-3.03 1.8 0 1.07.85 1.85 1.95 1.85 1.25 0 2.02-.72 2.02-2.38V1.5h4.11z" /></svg>,
  },
] as const;

export default function Footer({ site }: { site: SiteInfo }) {
  return (
    <footer className={styles.siteFooter}>
      <div className={styles.inner}>
        <p>&copy; {new Date().getFullYear()} {site.name}</p>

        <ul className={styles.footerLinks}>
          {FOOTER_LINKS.map((link) => (
            <li key={link.href}>
              <Link to={link.href}>{link.name}</Link>
            </li>
          ))}
        </ul>

        <div className={styles.footerSocial}>
          {SOCIAL_LINKS.map((item) => {
            const href = site[item.key as keyof SiteInfo];
            return href ? (
              <a key={item.key} href={href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
                {item.icon}
              </a>
            ) : null;
          })}
        </div>
      </div>
    </footer>
  );
}
