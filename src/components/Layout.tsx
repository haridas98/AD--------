import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAppStore } from '../store/useAppStore';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { site, sections } = useAppStore();

  if (!site || !sections.length) {
    return null;
  }

  return (
    <>
      <Header sections={sections} />
      {children}
      <Footer site={site} sections={sections} />
    </>
  );
}
