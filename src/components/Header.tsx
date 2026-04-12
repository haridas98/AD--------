import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-inner">
        {/* Logo */}
        <NavLink to="/" className="brand" onClick={closeMenu}>
          Alexandra Diz
        </NavLink>

        {/* Desktop nav */}
        <nav className="desktop-nav">
          {menuItems.map((item) => (
            <div key={item.name} className="nav-item-wrap">
              <NavLink
                to={item.href}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={closeMenu}
              >
                {item.name}
              </NavLink>
              {item.sub && (
                <div className="submenu">
                  {item.sub.map((sub) => (
                    <NavLink key={sub.href} to={sub.href} className="submenu-link" onClick={closeMenu}>
                      {sub.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div className="mobile-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeMenu} />
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <nav className={`top-nav ${menuOpen ? 'open' : ''}`}>
        <button className="top-nav-close" onClick={closeMenu} aria-label="Close">✕</button>
        {menuItems.map((item) => (
          <div key={item.name}>
            <NavLink to={item.href} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>
              {item.name}
            </NavLink>
            {item.sub && (
              <div className="submenu-group">
                {item.sub.map((sub) => (
                  <NavLink key={sub.href} to={sub.href} className="submenu-link" onClick={closeMenu}>
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
