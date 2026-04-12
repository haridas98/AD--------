import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Section } from '../types';

export default function Header({ sections }: { sections: Section[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const navItems = sections.filter((s) => s.id !== 'projects');
  // Insert Blog before About
  const blogItem = { id: 'blog', name: 'Blog', type: 'page' as const, slug: 'blog' };
  const aboutIdx = navItems.findIndex((s) => s.name.toLowerCase().includes('about') || s.name.toLowerCase().includes('services') || s.id === 'about' || s.id === 'services');
  const finalItems = aboutIdx >= 0 ? [...navItems.slice(0, aboutIdx), blogItem, ...navItems.slice(aboutIdx)] : [...navItems, blogItem];

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
          {finalItems.map((item) => {
            let href = `/${item.slug || item.id}`;
            if (item.type === 'category') href = `/category/${item.id}`;
            if (item.id === 'blog') href = '/blog';
            return (
              <NavLink key={item.id} to={href} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}>
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
