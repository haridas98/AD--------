import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAppStore } from '../store/useAppStore';

interface LayoutProps { children: React.ReactNode; isAdmin?: boolean; }

export default function Layout({ children, isAdmin }: LayoutProps) {
  const { site, sections } = useAppStore();

  if (isAdmin) {
    return <div className="admin-layout">{children}</div>;
  }

  return (
    <>
      {site ? <Header sections={sections} /> : <div className="site-header" style={{ height: '60px' }} />}
      {children}
      {site ? <Footer site={site} /> : null}
    </>
  );
}
