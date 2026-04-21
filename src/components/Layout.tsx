import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAppStore } from '../store/useAppStore';

interface LayoutProps { children: React.ReactNode; isAdmin?: boolean; }

export default function Layout({ children, isAdmin }: LayoutProps) {
  const { site } = useAppStore();

  if (isAdmin) {
    return <div className="admin-layout">{children}</div>;
  }

  return (
    <div className="site-shell" data-page-shell>
      {site ? <Header /> : <div style={{ height: '72px' }} />}
      <div className="site-shell__content">{children}</div>
      {site ? <Footer site={site} /> : null}
    </div>
  );
}
