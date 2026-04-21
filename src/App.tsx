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
import ServicesPage from './pages/ServicesPage';
import AboutPage from './pages/AboutPage';
import VideoSeriesPage from './pages/VideoSeriesPage';
import BeforeAfterPage from './pages/BeforeAfterPage';
import ContactPage from './pages/ContactPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import AdminPage from './pages/AdminPage';

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <motion.div key={location.pathname} className="page-transition" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' }}>{children}</motion.div>
  );
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return null;
}

export default function App() {
  const location = useLocation();
  const setContent = useAppStore((s) => s.setContent);
  const setLoading = useAppStore((s) => s.setLoading);
  const setError = useAppStore((s) => s.setError);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const site = useAppStore((s) => s.site);
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        const data = await api.getContent();
        setContent({
          site: { name: 'Alexandra Diz Architecture', phone: '+1 415 769 8563', email: 'alexandra@alexandradiz.com', instagram: data.site?.instagram || '', facebook: data.site?.facebook || '', houzz: data.site?.houzz || '' },
          sections: data.sections || [],
          categories: data.categories || [],
          projects: data.projects || [],
          blogPosts: data.blogPosts || [],
          pages: data.pages || {},
          themeSettings: data.themeSettings,
        });
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (!isAdminRoute && !site && !error) return <div className="app-loading">Loading...</div>;
  if (!isAdminRoute && error && !site) return <div className="app-error"><h1>Error</h1><p>{error}</p><button className="btn-primary" onClick={() => window.location.reload()}>Reload</button></div>;

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ScrollToTop />
        <Layout isAdmin={isAdminRoute}>
          <AnimatePresence mode="wait">
            <PageTransition>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/kitchens" element={<CategoryPage />} />
                <Route path="/full-house-remodeling" element={<CategoryPage />} />
                <Route path="/bathrooms" element={<CategoryPage />} />
                <Route path="/adu1" element={<CategoryPage />} />
                <Route path="/projects-before-and-after" element={<BeforeAfterPage />} />
                <Route path="/fireplaces" element={<CategoryPage />} />
                <Route path="/kitchens/:slug" element={<ProjectPage />} />
                <Route path="/full-house-remodeling/:slug" element={<ProjectPage />} />
                <Route path="/bathrooms/:slug" element={<ProjectPage />} />
                <Route path="/adu1/:slug" element={<ProjectPage />} />
                <Route path="/projects-before-and-after/:slug" element={<ProjectPage />} />
                <Route path="/fireplaces/:slug" element={<ProjectPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/video-series" element={<VideoSeriesPage />} />
                <Route path="/process" element={<ServicesPage serviceType="process" />} />
                <Route path="/process_bath" element={<ServicesPage serviceType="process_bath" />} />
                <Route path="/process_kitchen" element={<ServicesPage serviceType="process_kitchen" />} />
                <Route path="/press" element={<AboutPage aboutType="press" />} />
                <Route path="/testimonials" element={<AboutPage aboutType="testimonials" />} />
                <Route path="/aboutme" element={<AboutPage aboutType="aboutme" />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/admin" element={<AdminWrapper />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </PageTransition>
          </AnimatePresence>
        </Layout>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

function AdminWrapper() {
  const { projects, categories, blogPosts, themeSettings, setContent } = useAppStore();
  const [data, setData] = useState({ projects, categories, blogPosts, themeSettings });
  const refresh = async () => {
    try {
      const d = await api.getAdminContent();
      setContent({ projects: d.projects, categories: d.categories, blogPosts: d.blogPosts, themeSettings: d.themeSettings });
      setData({ projects: d.projects, categories: d.categories, blogPosts: d.blogPosts, themeSettings: d.themeSettings });
    } catch (e) { console.error(e); }
  };
  useEffect(() => { setData({ projects, categories, blogPosts, themeSettings }); }, [projects, categories, blogPosts, themeSettings]);
  return <AdminPage data={data} refresh={refresh} />;
}
