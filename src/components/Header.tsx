import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Header.module.scss';

interface MenuSection {
  name: string;
  href: string;
  sub?: { name: string; href: string }[];
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const menuItems: MenuSection[] = [
    { name: 'Projects', href: '/' },
    { name: 'Kitchens', href: '/kitchens' },
    { name: 'Full house remodeling', href: '/full-house-remodeling' },
    { name: 'Bathroom', href: '/bathrooms' },
    { name: 'ADU', href: '/adu1' },
    { name: 'Projects before and after', href: '/projects-before-and-after' },
    { name: 'Video Series', href: '/video-series' },
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
                {item.name}
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

        <button className={styles.menuToggle} onClick={() => setMenuOpen((value) => !value)} aria-label="Menu">
          {menuOpen ? '✕' : '☰'}
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
        <button className={styles.topNavClose} onClick={closeMenu} aria-label="Close">
          ✕
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
