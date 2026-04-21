import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAppStore } from '../store/useAppStore';
import { getThemeCssVariables } from '../lib/themeTokens';

interface LayoutProps { children: React.ReactNode; isAdmin?: boolean; }

export default function Layout({ children, isAdmin }: LayoutProps) {
  const { site, themeMode, themeSettings } = useAppStore();

  if (isAdmin) {
    return <div className="admin-layout">{children}</div>;
  }

  return (
    <div className="site-shell" data-page-shell data-theme={themeMode} style={getThemeCssVariables(themeMode, themeSettings)}>
      {site ? <Header /> : <div style={{ height: '72px' }} />}
      <div className="site-shell__content">{children}</div>
      {site ? <Footer site={site} /> : null}
    </div>
  );
}
