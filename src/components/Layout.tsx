import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAppStore } from '../store/useAppStore';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { site, sections } = useAppStore();

  return (
    <>
      {site ? <Header sections={sections} /> : <div className="site-header" style={{ height: '60px' }} />}
      {children}
      {site ? <Footer site={site} /> : null}
    </>
  );
}
