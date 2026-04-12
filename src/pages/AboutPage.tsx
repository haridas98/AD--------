import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

interface AboutPageProps { aboutType: string; }

export default function AboutPage({ aboutType }: AboutPageProps) {
  const { site } = useAppStore();

  const navItems = [
    { id: 'press', name: 'Press | Media' },
    { id: 'testimonials', name: 'Testimonials' },
    { id: 'aboutme', name: 'About me' },
  ];

  const activeItem = navItems.find((n) => n.id === aboutType) || navItems[2];

  return (
    <>
      <Helmet>
        <title>{activeItem.name} — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={activeItem.name} />
      </Helmet>
      <motion.main className="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '100px 15px 60px', maxWidth: '900px' }}>
        {/* Sub-nav */}
        <nav style={{ marginBottom: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {navItems.map((s) => (
            <Link key={s.id} to={`/${s.id}`} style={{
              color: aboutType === s.id ? 'rgba(198,164,123,1)' : 'rgba(255,255,255,0.5)',
              fontSize: '12px', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em',
              borderBottom: aboutType === s.id ? '1px solid rgba(198,164,123,1)' : '1px solid transparent',
              paddingBottom: '4px', transition: 'all 0.2s'
            }}>
              {s.name}
            </Link>
          ))}
        </nav>

        {aboutType === 'aboutme' && <AboutMeContent />}
        {aboutType === 'press' && <PressContent />}
        {aboutType === 'testimonials' && <TestimonialsContent />}
      </motion.main>
    </>
  );
}

function AboutMeContent() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
      <div>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '18px', lineHeight: 1.6, margin: '0 0 20px', fontWeight: 600 }}>Hi! I'm Alexandra, and I'm interior designer.</p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.8, margin: '0 0 15px' }}>I have a master degree in architecture and I'm working in interior design for more than 10 years, more than 6 of them under my own brand Alexandra Diz.</p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.8, margin: '0 0 15px' }}>I studied architecture and it gives me the opportunity to see the space in a new way, and to design it the best possible way for my clients. Here, at Alexandra Diz, we think about layout flow, light, textures and a lot about design and creating the best version of your home.</p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.8, margin: '0 0 15px' }}>I worked in Russia, Germany, Israel and California. I speak Russian, Hebrew, German and English.</p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.8, margin: '0 0 15px' }}>I'm helping my clients through all the design process, starting from first ideas and sketches, going through all drawings and planning, permit process and 3d visualizations, orders, and standing by during the construction.</p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', lineHeight: 1.8, margin: '0 0 30px' }}>I will be happy to assist you with the project and make the best version of your home!</p>
        <Link to="/contact" className="btn-primary">Get in Touch</Link>
      </div>
      <div style={{ display: 'grid', gap: '25px' }}>
        <div>
          <h3 style={{ color: 'rgba(198,164,123,1)', fontSize: '18px', fontWeight: 600, margin: '0 0 10px' }}>Education</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>Saint Petersburg Academy of Fine Arts and Germany Bauhaus-Universität Weimar.</p>
        </div>
        <div>
          <h3 style={{ color: 'rgba(198,164,123,1)', fontSize: '18px', fontWeight: 600, margin: '0 0 10px' }}>Awards</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>Top 10 interior designer in Israel 2019</p>
        </div>
        <div>
          <h3 style={{ color: 'rgba(198,164,123,1)', fontSize: '18px', fontWeight: 600, margin: '0 0 10px' }}>Languages</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>Russian, Hebrew, German, English</p>
        </div>
      </div>
    </div>
  );
}

function PressContent() {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 20px' }}>Alexandra Diz Architecture has been featured in numerous publications for innovative interior design and remodeling projects across the San Francisco Bay Area.</p>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>For media inquiries and press features, please contact us directly.</p>
    </div>
  );
}

function TestimonialsContent() {
  const testimonials = [
    { text: "Alexandra transformed our outdated kitchen into a modern masterpiece. Her attention to detail and understanding of our lifestyle needs was exceptional.", author: 'Homeowner, Redwood City' },
    { text: "The bathroom redesign exceeded our expectations. Every element was thoughtfully chosen and the result is both beautiful and functional.", author: 'Client, Palo Alto' },
    { text: "Working with Alexandra on our full house remodel was a seamless experience. She managed every detail and delivered beyond our vision.", author: 'Homeowner, Los Altos' },
  ];

  return (
    <div style={{ display: 'grid', gap: '30px', maxWidth: '700px', margin: '0 auto' }}>
      {testimonials.map((t, i) => (
        <blockquote key={i} style={{ borderLeft: '2px solid rgba(198,164,123,0.5)', paddingLeft: '20px', margin: 0 }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', lineHeight: 1.7, fontStyle: 'italic', margin: '0 0 10px' }}>"{t.text}"</p>
          <cite style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontStyle: 'normal' }}>— {t.author}</cite>
        </blockquote>
      ))}
    </div>
  );
}
