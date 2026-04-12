import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

interface AboutPageProps {
  aboutType: string;
}

export default function AboutPage({ aboutType }: AboutPageProps) {
  const { site } = useAppStore();

  const pages = {
    press: {
      title: 'Press | Media',
      content: `<p>Alexandra Diz Architecture has been featured in numerous publications for innovative interior design and remodeling projects across the San Francisco Bay Area.</p><p>Our work combines refined California aesthetics with practical functionality, earning recognition from leading design magazines and real estate publications.</p><p>For media inquiries and press features, please contact us directly.</p>`,
    },
    testimonials: {
      title: 'Testimonials',
      content: `<p>"Alexandra transformed our outdated kitchen into a modern masterpiece. Her attention to detail and understanding of our lifestyle needs was exceptional." — <em>Homeowner, Redwood City</em></p><p>"The bathroom redesign exceeded our expectations. Every element was thoughtfully chosen and the result is both beautiful and functional." — <em>Client, Palo Alto</em></p><p>"Working with Alexandra on our full house remodel was a seamless experience. She managed every detail and delivered beyond our vision." — <em>Homeowner, Los Altos</em></p>`,
    },
    aboutme: {
      title: 'About Alexandra',
      content: `<p>With years of experience in interior architecture and remodeling, Alexandra Diz has established herself as a leading designer in the San Francisco Bay Area.</p><p>Her approach combines European design sensibility with California's relaxed elegance, creating spaces that are both sophisticated and livable.</p><p>Specializing in kitchen and bathroom remodeling, full house transformations, and ADU design, Alexandra brings a comprehensive understanding of both aesthetics and construction to every project.</p><p>Based in the Bay Area, she serves clients throughout San Francisco, Peninsula, and South Bay communities.</p>`,
    },
  };

  const page = pages[aboutType as keyof typeof pages] || pages.aboutme;

  return (
    <>
      <Helmet>
        <title>{page.title} — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={`${page.title} by Alexandra Diz Architecture`} />
      </Helmet>
      <motion.main className="container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '120px 15px 60px', maxWidth: '900px' }}>
        <nav style={{ marginBottom: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <Link to="/press" style={{ color: aboutType === 'press' ? 'rgba(198,164,123,1)' : 'rgba(255,255,255,0.5)', fontSize: '14px', textDecoration: 'none' }}>Press | Media</Link>
          <Link to="/testimonials" style={{ color: aboutType === 'testimonials' ? 'rgba(198,164,123,1)' : 'rgba(255,255,255,0.5)', fontSize: '14px', textDecoration: 'none' }}>Testimonials</Link>
          <Link to="/aboutme" style={{ color: aboutType === 'aboutme' ? 'rgba(198,164,123,1)' : 'rgba(255,255,255,0.5)', fontSize: '14px', textDecoration: 'none' }}>About Me</Link>
        </nav>
        <h1 style={{ color: '#fff', fontFamily: "'GilroyExtraBold', sans-serif", fontSize: '32px', fontWeight: 800, margin: '0 0 20px' }}>{page.title}</h1>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: page.content }} />
      </motion.main>
    </>
  );
}
