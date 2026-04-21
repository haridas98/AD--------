import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import styles from './Header.module.scss';

interface MenuSection {
  name: string;
  desktopName?: string;
  href: string;
  sub?: { name: string; href: string }[];
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const themeMode = useAppStore((s) => s.themeMode);
  const toggleThemeMode = useAppStore((s) => s.toggleThemeMode);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const menuItems: MenuSection[] = [
    { name: 'Projects', href: '/' },
    { name: 'Kitchens', href: '/kitchens' },
    { name: 'Full house remodeling', desktopName: 'Full House', href: '/full-house-remodeling' },
    { name: 'Bathroom', href: '/bathrooms' },
    { name: 'ADU', href: '/adu1' },
    { name: 'Projects before and after', desktopName: 'Before & After', href: '/projects-before-and-after' },
    { name: 'Video Series', desktopName: 'Video', href: '/video-series' },
    {
      name: 'Services',
      href: '/process',
      sub: [
        { name: 'Full Service Interior Design', href: '/process' },
        { name: 'Bathroom Remodeling', href: '/process_bath' },
        { name: 'Kitchen Remodeling', href: '/process_kitchen' },
      ],
    },
    {
      name: 'About me',
      desktopName: 'About',
      href: '/aboutme',
      sub: [
        { name: 'Press | Media', href: '/press' },
        { name: 'Testimonials', href: '/testimonials' },
        { name: 'About me', href: '/aboutme' },
      ],
    },
    { name: 'Contact', href: '/contact' },
    { name: 'Fireplaces', href: '/fireplaces' },
  ];

  return (
    <header className={`${styles.siteHeader} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand} onClick={closeMenu}>
          Alexandra Diz
        </NavLink>

        <nav className={styles.desktopNav}>
          {menuItems.map((item) => (
            <div key={item.name} className={styles.navItemWrap}>
              <NavLink
                to={item.href}
                className={({ isActive }) => `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`}
                onClick={closeMenu}
              >
                {item.desktopName || item.name}
              </NavLink>
              {item.sub && (
                <div className={styles.submenu}>
                  {item.sub.map((sub) => (
                    <NavLink key={sub.href} to={sub.href} className={styles.submenuLink} onClick={closeMenu}>
                      {sub.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <button
          className={styles.themeToggle}
          onClick={toggleThemeMode}
          aria-label={themeMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={themeMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <span className={styles.themeToggleText}>{themeMode === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span className={`${styles.menuToggleIcon} ${menuOpen ? styles.menuToggleIconOpen : ''}`} aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className={styles.mobileOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>

      <nav className={`${styles.topNav} ${menuOpen ? styles.open : ''}`}>
        <button
          className={styles.mobileThemeToggle}
          onClick={toggleThemeMode}
          aria-label={themeMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          Theme: {themeMode === 'dark' ? 'Light' : 'Dark'}
        </button>
        {menuItems.map((item) => (
          <div key={item.name}>
            <NavLink
              to={item.href}
              className={({ isActive }) => `${styles.mobileNavLink}${isActive ? ` ${styles.active}` : ''}`}
              onClick={closeMenu}
            >
              {item.name}
            </NavLink>
            {item.sub && (
              <div className={styles.submenuGroup}>
                {item.sub.map((sub) => (
                  <NavLink key={sub.href} to={sub.href} className={styles.mobileSubmenuLink} onClick={closeMenu}>
                    {sub.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </header>
  );
}
