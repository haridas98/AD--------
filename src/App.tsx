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
import BeforeAfterPage from './pages/BeforeAfterPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import AdminPage from './pages/AdminPage';

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' }}>{children}</motion.div>
  );
}

export default function App() {
  const setContent = useAppStore((s) => s.setContent);
  const setLoading = useAppStore((s) => s.setLoading);
  const setError = useAppStore((s) => s.setError);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const site = useAppStore((s) => s.site);

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
        });
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading && !site) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#141414', color: '#fff' }}>Loading...</div>;
  if (error && !site) return <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#141414', color: '#fff' }}><h1>Error</h1><p>{error}</p><button className="btn-primary" onClick={() => window.location.reload()}>Reload</button></div>;

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <Layout isAdmin={location.pathname.startsWith('/admin')}>
          <AnimatePresence mode="wait">
            <PageTransition>
              <Routes>
                <Route path="/" element={<HomePage />} />

                {/* Category pages: /kitchens, /bathrooms, etc. */}
                <Route path="/kitchens" element={<CategoryPage />} />
                <Route path="/full-house-remodeling" element={<CategoryPage />} />
                <Route path="/bathrooms" element={<CategoryPage />} />
                <Route path="/adu1" element={<CategoryPage />} />
                <Route path="/projects-before-and-after" element={<BeforeAfterPage />} />
                <Route path="/fireplaces" element={<CategoryPage />} />

                {/* Project pages: /kitchens/modern-kitchen, /bathrooms/relax-oasis, etc. */}
                <Route path="/kitchens/:slug" element={<ProjectPage />} />
                <Route path="/full-house-remodeling/:slug" element={<ProjectPage />} />
                <Route path="/bathrooms/:slug" element={<ProjectPage />} />
                <Route path="/adu1/:slug" element={<ProjectPage />} />
                <Route path="/projects-before-and-after/:slug" element={<ProjectPage />} />
                <Route path="/fireplaces/:slug" element={<ProjectPage />} />

                {/* Static pages */}
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/video-series" element={<VideoSeriesPage />} />
                <Route path="/process" element={<ServicesPage serviceType="process" />} />
                <Route path="/process_bath" element={<ServicesPage serviceType="process_bath" />} />
                <Route path="/process_kitchen" element={<ServicesPage serviceType="process_kitchen" />} />
                <Route path="/press" element={<AboutPage aboutType="press" />} />
                <Route path="/testimonials" element={<AboutPage aboutType="testimonials" />} />
                <Route path="/aboutme" element={<AboutPage aboutType="aboutme" />} />

                {/* Blog */}
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />

                {/* Admin */}
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

function ContactPage() {
  const { site } = useAppStore();
  return (
    <motion.main className="container contact-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '120px 15px 60px' }}>
      <h1 style={{ color: '#fff' }}>Contact</h1>
      <p style={{ color: 'rgba(255,255,255,0.7)' }}>For project inquiries, use the contacts below or reach out through social channels.</p>
      <div className="contact-info">
        {site?.email && <div className="contact-item"><strong style={{ color: '#fff' }}>Email:</strong> <a href={`mailto:${site.email}`}>{site.email}</a></div>}
        {site?.phone && <div className="contact-item"><strong style={{ color: '#fff' }}>Phone:</strong> <a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a></div>}
        {site?.instagram && <div className="contact-item"><strong style={{ color: '#fff' }}>Instagram:</strong> <a href={site.instagram} target="_blank" rel="noopener noreferrer">@alexandra_diz</a></div>}
      </div>
    </motion.main>
  );
}

function VideoSeriesPage() {
  return (
    <motion.main className="container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '120px 15px 60px', textAlign: 'center' }}>
      <h1 style={{ color: '#fff' }}>Video Series</h1>
      <p style={{ color: 'rgba(255,255,255,0.7)' }}>Coming soon — video content showcasing our design process.</p>
    </motion.main>
  );
}

function AdminWrapper() {
  const { projects, categories, blogPosts, setContent } = useAppStore();
  const [data, setData] = useState({ projects, categories, blogPosts });
  const refresh = async () => {
    try {
      const d = await api.getAdminContent();
      setContent({ projects: d.projects, categories: d.categories, blogPosts: d.blogPosts });
      setData({ projects: d.projects, categories: d.categories, blogPosts: d.blogPosts });
    } catch (e) { console.error(e); }
  };
  useEffect(() => { setData({ projects, categories, blogPosts }); }, [projects, categories, blogPosts]);
  return <AdminPage data={data} refresh={refresh} />;
}
