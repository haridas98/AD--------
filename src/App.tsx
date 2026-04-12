import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { api } from './lib/api';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProjectPage from './pages/ProjectPage';
import StaticPage from './pages/StaticPage';
import AdminPage from './pages/AdminPage';

// Wrapper component for page transitions
function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Loading component
function LoadingScreen() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#141414',
      }}
    >
      <div
        style={{
          color: '#fff',
          fontFamily: 'sans-serif',
          fontSize: '18px',
        }}
      >
        Loading...
      </div>
    </div>
  );
}

export default function App() {
  const setContent = useAppStore((state) => state.setContent);
  const setLoading = useAppStore((state) => state.setLoading);
  const setError = useAppStore((state) => state.setError);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const site = useAppStore((state) => state.site);

  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      setError(null);

      try {
        const data = await api.getContent();
        setContent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
        console.error('Failed to load content:', err);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [setContent, setLoading, setError]);

  if (loading && !site) {
    return <LoadingScreen />;
  }

  if (error && !site) {
    return (
      <main
        className="error-boundary"
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
      >
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '1rem' }}>
          Load error
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
        <button
          className="btn-primary"
          style={{ marginTop: '1rem' }}
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </main>
    );
  }

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <Layout>
          <AnimatePresence mode="wait">
            <PageTransition>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/section/:categoryId" element={<CategoryPage />} />
                <Route path="/project/:slug" element={<ProjectPage />} />
                <Route path="/:pageId" element={<StaticPage />} />
                <Route path="/admin" element={<AdminPageWrapper />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </PageTransition>
          </AnimatePresence>
        </Layout>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

// Wrapper for AdminPage to provide store context
function AdminPageWrapper() {
  const { projects, categories, setContent } = useAppStore();
  const [data, setData] = useState({ projects, categories });
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const payload = await api.getContent();
      setContent(payload);
      setData({ projects: payload.projects || [], categories: payload.categories || [] });
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setData({ projects, categories });
  }, [projects, categories]);

  return <AdminPage data={data} refresh={refresh} />;
}
