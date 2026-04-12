import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export default function ContactPage() {
  const { site } = useAppStore();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <>
      <Helmet>
        <title>Contact — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content="Contact Alexandra Diz for interior design inquiries" />
      </Helmet>
      <motion.main className="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '100px 15px 60px', maxWidth: '800px' }}>
        <h1 style={{ color: '#fff', fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3vw, 39px)', fontWeight: 400, margin: '0 0 30px', textAlign: 'center', letterSpacing: '0.25em', textTransform: 'uppercase' }}>Contacts</h1>

        {/* Contact info */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '18px', lineHeight: 1.6, margin: '0 0 15px' }}>
            +1 415 769 8563<br />
            alexandra@alexandradiz.com
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            {site?.instagram && (
              <a href={site.instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '24px', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,1)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
            )}
            {site?.facebook && (
              <a href={site.facebook} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '24px', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,1)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>
              </a>
            )}
            {site?.houzz && (
              <a href={site.houzz} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '24px', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,1)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1.955 17.291h-2.045v-7.981h-2.977v-1.775h5.022v9.756zm3.955-17.291h-4v3.273h4v-3.273z" /></svg>
              </a>
            )}
          </div>
        </div>

        {/* Contact form */}
        <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
          {submitted && (
            <div style={{ background: 'rgba(39,174,96,0.2)', border: '1px solid rgba(39,174,96,0.5)', borderRadius: '8px', padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ color: '#27ae60', margin: 0, fontSize: '14px' }}>Thank you! Your message has been sent.</p>
            </div>
          )}
          <div style={{ display: 'grid', gap: '16px' }}>
            <input
              type="text"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', fontFamily: 'inherit' }}
            />
            <input
              type="email"
              placeholder="Your e-mail *"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', fontFamily: 'inherit' }}
            />
            <textarea
              placeholder="Your message"
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
            />
            <button type="submit" className="btn-primary" style={{ justifySelf: 'start' }}>Send Message</button>
          </div>
        </form>
      </motion.main>
    </>
  );
}
