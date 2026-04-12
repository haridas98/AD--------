import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Section, Category } from '../types';

interface HeaderProps {
  sections: Section[];
  categories?: Category[];
}

export default function Header({ sections, categories }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  // Build exact original menu structure
  const menuItems = [
    { id: 'projects', name: 'Projects', href: '/' },
    { id: 'kitchens', name: 'Kitchens', href: '/kitchens' },
    { id: 'full-house-remodeling', name: 'Full house remodeling', href: '/full-house-remodeling' },
    { id: 'bathrooms', name: 'Bathroom', href: '/bathrooms' },
    { id: 'adu1', name: 'ADU', href: '/adu1' },
    { id: 'projects-before-and-after', name: 'Projects before and after', href: '/projects-before-and-after' },
    { id: 'video-series', name: 'Video Series', href: '/video-series' },
    { id: 'services', name: 'Services', href: '/process', sub: [
      { name: 'Full Service Interior Design', href: '/process' },
      { name: 'Bathroom Remodeling', href: '/process_bath' },
      { name: 'Kitchen Remodeling', href: '/process_kitchen' },
    ]},
    { id: 'about-me', name: 'About me', href: '/press', sub: [
      { name: 'Press | Media', href: '/press' },
      { name: 'Testimonials', href: '/testimonials' },
      { name: 'About me', href: '/aboutme' },
    ]},
    { id: 'contact', name: 'Contact', href: '/contact' },
    { id: 'fireplaces', name: 'Fireplaces', href: '/fireplaces' },
  ];

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container header-inner">
        <NavLink to="/" className="brand" onClick={closeMenu}>Alexandra Diz</NavLink>

        <button className={`menu-toggle ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span /><span /><span />
        </button>

        <AnimatePresence>
          {menuOpen && <motion.div className="mobile-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeMenu} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />}
        </AnimatePresence>

        <nav className={`top-nav ${menuOpen ? 'open' : ''}`}>
          <button className="top-nav-close" onClick={closeMenu} aria-label="Close">✕</button>
          {menuItems.map((item) => (
            <div key={item.id} className="nav-item-wrap">
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
                    <NavLink key={sub.href} to={sub.href} className="submenu-link" onClick={closeMenu}>{sub.name}</NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
