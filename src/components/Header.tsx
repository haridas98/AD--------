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
      <div className="header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', height: '60px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Logo */}
        <NavLink to="/" className="brand" onClick={closeMenu} style={{ fontFamily: "'GilroyLight', sans-serif", fontSize: '14px', fontWeight: 400, color: '#fff', letterSpacing: '0', whiteSpace: 'nowrap' }}>
          Alexandra Diz
        </NavLink>

        {/* Desktop nav */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0', flex: 1, justifyContent: 'center' }}>
          {menuItems.map((item) => (
            <div key={item.name} className="nav-item-wrap" style={{ position: 'relative' }}>
              <NavLink
                to={item.href}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={closeMenu}
                style={{ padding: '0 12px', height: '60px', display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.02em', transition: 'color 0.2s', whiteSpace: 'nowrap' }}
              >
                {item.name}
              </NavLink>
              {item.sub && (
                <div className="submenu" style={{ position: 'absolute', top: '100%', left: '0', background: 'rgba(20,20,20,0.98)', minWidth: '200px', padding: '10px 0', opacity: 0, visibility: 'hidden', transition: 'all 0.2s', zIndex: 100, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  {item.sub.map((sub) => (
                    <NavLink key={sub.href} to={sub.href} className="submenu-link" onClick={closeMenu}
                      style={{ display: 'block', padding: '8px 20px', fontSize: '11px', color: 'rgba(255,255,255,0.7)', transition: 'color 0.2s' }}
                    >{sub.name}</NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu"
          style={{ display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', padding: '8px' }}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div className="mobile-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeMenu} style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.5)' }} />
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <nav className={`top-nav ${menuOpen ? 'open' : ''}`}>
        <button className="top-nav-close" onClick={closeMenu} aria-label="Close">✕</button>
        {menuItems.map((item) => (
          <div key={item.name}>
            <NavLink to={item.href} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeMenu}
              style={{ display: 'block', padding: '12px 20px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
              {item.name}
            </NavLink>
            {item.sub && (
              <div style={{ paddingLeft: '20px' }}>
                {item.sub.map((sub) => (
                  <NavLink key={sub.href} to={sub.href} className="submenu-link" onClick={closeMenu}
                    style={{ display: 'block', padding: '8px 20px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
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
