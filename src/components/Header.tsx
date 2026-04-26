import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import styles from './Header.module.scss';
import { PORTFOLIO_ROOT_PATH, portfolioHeaderItems } from '../lib/portfolioRoutes';

interface MenuSection {
  name: string;
  desktopName?: string;
  href: string;
  sub?: { name: string; href: string }[];
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [transparentOverHero, setTransparentOverHero] = useState(false);
  const location = useLocation();
  const themeMode = useAppStore((s) => s.themeMode);
  const toggleThemeMode = useAppStore((s) => s.toggleThemeMode);

  useEffect(() => {
    const updateHeaderState = () => {
      setScrolled(window.scrollY > 30);

      const hero = document.querySelector('.project-hero--immersive, [data-home-hero="immersive"]');
      if (!hero) {
        setTransparentOverHero(false);
        return;
      }

      const headerHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-offset')) || 72;
      const rect = hero.getBoundingClientRect();
      setTransparentOverHero(rect.top <= headerHeight && rect.bottom > headerHeight + 4);
    };

    const onScroll = () => updateHeaderState();
    const frameId = window.requestAnimationFrame(updateHeaderState);
    const timeoutId = window.setTimeout(updateHeaderState, 250);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [location.pathname]);

  const closeMenu = () => {
    setMenuOpen(false);

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const menuItems: MenuSection[] = [
    { name: 'Home', href: '/' },
    {
      name: 'Projects',
      href: PORTFOLIO_ROOT_PATH,
      sub: portfolioHeaderItems.map((item) => ({ name: item.name, href: item.href })),
    },
    { name: 'Blog', href: '/blog' },
    { name: 'Video', href: '/video' },
    {
      name: 'Services',
      href: '/services',
      sub: [
        { name: 'Full Service Interior Design', href: '/process' },
        { name: 'Bathroom Remodeling', href: '/process_bath' },
        { name: 'Kitchen Remodeling', href: '/process_kitchen' },
      ],
    },
    {
      name: 'About',
      href: '/about',
      sub: [
        { name: 'Press | Media', href: '/press' },
        { name: 'Testimonials', href: '/testimonials' },
        { name: 'About me', href: '/aboutme' },
      ],
    },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className={`${styles.siteHeader} ${scrolled ? styles.scrolled : ''} ${transparentOverHero && !menuOpen ? styles.transparentOverHero : ''}`} data-site-header>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand} onClick={closeMenu}>
          Alexandra Diz
        </NavLink>

        <nav className={styles.desktopNav}>
          {menuItems.map((item) => (
            <div
              key={item.name}
              className={styles.navItemWrap}
              data-nav-projects={item.name === 'Projects' ? 'true' : undefined}
            >
              <NavLink
                to={item.href}
                className={({ isActive }) => `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`}
                onClick={closeMenu}
                end={item.href === '/'}
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
              end={item.href === '/'}
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
