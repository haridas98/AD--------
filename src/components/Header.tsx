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
  const isDarkTheme = themeMode === 'dark';
  const themeToggleClass = `${styles.themeToggle} ${isDarkTheme ? styles.themeToggleDark : styles.themeToggleLight}`;
  const themeIconClass = `${styles.themeToggleIcon} ${isDarkTheme ? styles.themeToggleIconMoon : styles.themeToggleIconSun}`;
  const themeToggleLabel = isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme';

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
        <NavLink to="/" className={styles.brand} onClick={closeMenu} aria-label="Alexandra Diz">
          <span className={styles.brandMarkWrap} aria-hidden="true">
            <img className={`${styles.brandMark} ${styles.brandMarkDefault}`} src="/brand/alexandra-diz-mark.svg" alt="" />
            <img className={`${styles.brandMark} ${styles.brandMarkLight}`} src="/brand/alexandra-diz-mark-light.svg" alt="" />
          </span>
          <span className={styles.brandText}>Alexandra Diz</span>
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
          type="button"
          className={themeToggleClass}
          onClick={toggleThemeMode}
          aria-label={themeToggleLabel}
          title={themeToggleLabel}
        >
          {isDarkTheme ? (
            <svg className={themeIconClass} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 14.2A7.7 7.7 0 0 1 9.8 4a7.9 7.9 0 1 0 10.2 10.2Z" />
            </svg>
          ) : (
            <svg className={themeIconClass} viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2.8v2.4M12 18.8v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" />
            </svg>
          )}
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
          type="button"
          className={`${styles.mobileThemeToggle} ${themeToggleClass}`}
          onClick={toggleThemeMode}
          aria-label={themeToggleLabel}
        >
          {isDarkTheme ? (
            <svg className={themeIconClass} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 14.2A7.7 7.7 0 0 1 9.8 4a7.9 7.9 0 1 0 10.2 10.2Z" />
            </svg>
          ) : (
            <svg className={themeIconClass} viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2.8v2.4M12 18.8v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" />
            </svg>
          )}
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
