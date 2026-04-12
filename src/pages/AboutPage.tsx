import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

interface AboutPageProps { aboutType: string; }

export default function AboutPage({ aboutType }: AboutPageProps) {
  const { site } = useAppStore();

  const pages: Record<string, { title: string; content: React.ReactNode }> = {
    press: {
      title: 'Press | Media',
      content: (
        <div>
          <p>Alexandra Diz Architecture has been featured in numerous publications for innovative interior design and remodeling projects across the San Francisco Bay Area.</p>
          <p>Our work combines refined California aesthetics with practical functionality, earning recognition from leading design magazines and real estate publications.</p>
          <p><strong>Awards:</strong></p>
          <p>Top 10 interior designer in Israel 2019</p>
          <p>For media inquiries and press features, please contact us directly.</p>
        </div>
      ),
    },
    testimonials: {
      title: 'Testimonials',
      content: (
        <div style={{ display: 'grid', gap: '30px' }}>
          <blockquote style={{ borderLeft: '2px solid rgba(198,164,123,0.5)', paddingLeft: '20px', margin: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', lineHeight: 1.7, fontStyle: 'italic', margin: '0 0 10px' }}>"Alexandra transformed our outdated kitchen into a modern masterpiece. Her attention to detail and understanding of our lifestyle needs was exceptional."</p>
            <cite style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontStyle: 'normal' }}>— Homeowner, Redwood City</cite>
          </blockquote>
          <blockquote style={{ borderLeft: '2px solid rgba(198,164,123,0.5)', paddingLeft: '20px', margin: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', lineHeight: 1.7, fontStyle: 'italic', margin: '0 0 10px' }}>"The bathroom redesign exceeded our expectations. Every element was thoughtfully chosen and the result is both beautiful and functional."</p>
            <cite style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontStyle: 'normal' }}>— Client, Palo Alto</cite>
          </blockquote>
          <blockquote style={{ borderLeft: '2px solid rgba(198,164,123,0.5)', paddingLeft: '20px', margin: 0 }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', lineHeight: 1.7, fontStyle: 'italic', margin: '0 0 10px' }}>"Working with Alexandra on our full house remodel was a seamless experience. She managed every detail and delivered beyond our vision."</p>
            <cite style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontStyle: 'normal' }}>— Homeowner, Los Altos</cite>
          </blockquote>
        </div>
      ),
    },
    aboutme: {
      title: 'About Me',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px', lineHeight: 1.8, margin: '0 0 15px' }}>Hi! I'm Alexandra, and I'm interior designer.</p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.8, margin: '0 0 15px' }}>I have a master degree in architecture and I'm working in interior design for more than 10 years, more than 6 of them under my own brand Alexandra Diz.</p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.8, margin: '0 0 15px' }}>I studied architecture and it gives me the opportunity to see the space in a new way, and to design it the best possible way for my clients. Here, at Alexandra Diz, we think about layout flow, light, textures and a lot about design and creating the best version of your home.</p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.8, margin: '0 0 15px' }}>I worked in Russia, Germany, Israel and California. I speak Russian, Hebrew, German and English.</p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.8, margin: '0 0 30px' }}>I'm helping my clients through all the design process, starting from first ideas and sketches, going through all drawings and planning, permit process and 3d visualizations, orders, and standing by during the construction.</p>
            <Link to="/contact" className="btn-primary">Get in Touch</Link>
          </div>
          <div>
            <h3 style={{ color: 'rgba(198,164,123,1)', fontSize: '18px', fontWeight: 600, margin: '0 0 10px' }}>Education</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 25px' }}>Saint Petersburg Academy of Fine Arts and Germany Bauhaus-Universität Weimar.</p>
            <h3 style={{ color: 'rgba(198,164,123,1)', fontSize: '18px', fontWeight: 600, margin: '0 0 10px' }}>Awards</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 25px' }}>Top 10 interior designer in Israel 2019</p>
            <h3 style={{ color: 'rgba(198,164,123,1)', fontSize: '18px', fontWeight: 600, margin: '0 0 10px' }}>Languages</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>Russian, Hebrew, German, English</p>
          </div>
        </div>
      ),
    },
  };

  const page = pages[aboutType] || pages.aboutme;

  return (
    <>
      <Helmet>
        <title>{page.title} — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={page.title} />
      </Helmet>
      <motion.main className="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '100px 15px 60px', maxWidth: '1000px' }}>
        <nav style={{ marginBottom: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { id: 'press', name: 'Press | Media' },
            { id: 'testimonials', name: 'Testimonials' },
            { id: 'aboutme', name: 'About Me' },
          ].map((s) => (
            <Link key={s.id} to={`/${s.id}`} style={{ color: aboutType === s.id ? 'rgba(198,164,123,1)' : 'rgba(255,255,255,0.5)', fontSize: '13px', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: aboutType === s.id ? '1px solid rgba(198,164,123,1)' : '1px solid transparent', paddingBottom: '4px' }}>
              {s.name}
            </Link>
          ))}
        </nav>

        <h1 style={{ color: '#fff', fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 400, margin: '0 0 50px', textAlign: 'center' }}>{page.title}</h1>
        {page.content}
      </motion.main>
    </>
  );
}
