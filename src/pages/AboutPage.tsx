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
      <motion.main className="container contact-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '900px' }}>
        {/* Sub-nav */}
        <nav className="about-nav">
          {navItems.map((s) => (
            <Link key={s.id} to={`/${s.id}`} className={`about-nav-link${aboutType === s.id ? ' active' : ''}`}>
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
    <div className="about-grid">
      <div>
        <p className="about-text about-text--lead">Hi! I'm Alexandra, and I'm interior designer.</p>
        <p className="about-text">I have a master degree in architecture and I'm working in interior design for more than 10 years, more than 6 of them under my own brand Alexandra Diz.</p>
        <p className="about-text">I studied architecture and it gives me the opportunity to see the space in a new way, and to design it the best possible way for my clients. Here, at Alexandra Diz, we think about layout flow, light, textures and a lot about design and creating the best version of your home.</p>
        <p className="about-text">I worked in Russia, Germany, Israel and California. I speak Russian, Hebrew, German and English.</p>
        <p className="about-text">I'm helping my clients through all the design process, starting from first ideas and sketches, going through all drawings and planning, permit process and 3d visualizations, orders, and standing by during the construction.</p>
        <p className="about-text">I will be happy to assist you with the project and make the best version of your home!</p>
        <Link to="/contact" className="btn-primary">Get in Touch</Link>
      </div>
      <div className="about-info-grid">
        <div className="about-info-item">
          <h3>Education</h3>
          <p>Saint Petersburg Academy of Fine Arts and Germany Bauhaus-Universität Weimar.</p>
        </div>
        <div className="about-info-item">
          <h3>Awards</h3>
          <p>Top 10 interior designer in Israel 2019</p>
        </div>
        <div className="about-info-item">
          <h3>Languages</h3>
          <p>Russian, Hebrew, German, English</p>
        </div>
      </div>
    </div>
  );
}

function PressContent() {
  return (
    <div className="press-content">
      <p>Alexandra Diz Architecture has been featured in numerous publications for innovative interior design and remodeling projects across the San Francisco Bay Area.</p>
      <p className="text-muted">For media inquiries and press features, please contact us directly.</p>
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
    <div className="testimonials-grid">
      {testimonials.map((t, i) => (
        <blockquote key={i} className="testimonial">
          <p className="testimonial-text">"{t.text}"</p>
          <cite className="testimonial-author">— {t.author}</cite>
        </blockquote>
      ))}
    </div>
  );
}
