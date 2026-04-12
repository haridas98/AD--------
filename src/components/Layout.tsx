import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAppStore } from '../store/useAppStore';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { site, sections } = useAppStore();

  return (
    <>
      {site && sections.length > 0 ? (
        <Header sections={sections} />
      ) : null}
      {children}
      {site && sections.length > 0 ? (
        <Footer site={site} sections={sections} />
      ) : null}
    </>
  );
}
