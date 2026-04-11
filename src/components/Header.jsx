import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Header({ sections }) {
  const navItems = sections.filter((s) => s.id !== 'projects');

  return (
    <header className="site-header">
      <div className="container header-inner">
        <NavLink to="/" className="brand">Alexandra Diz</NavLink>
        <nav className="top-nav">
          {navItems.map((item) => {
            const href = item.type === 'category' ? `/section/${item.id}` : `/${item.slug || item.id}`;
            return (
              <NavLink key={item.id} to={href} className="nav-link">
                {item.name}
              </NavLink>
            );
          })}
          <NavLink to="/admin" className="nav-link nav-admin">Admin</NavLink>
        </nav>
      </div>
    </header>
  );
}
