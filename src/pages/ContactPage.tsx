import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { getPreviewImageUrl, handlePreviewFallback } from '../lib/imageUrls';
import { useAppStore } from '../store/useAppStore';
import styles from './ContactPage.module.scss';

const alexandraImage = '/home/Alexandra-2.jpg';

export default function ContactPage() {
  const { site } = useAppStore();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const phone = site?.phone || '+1 415 769 8563';
  const email = site?.email || 'alexandra@alexandradiz.com';
  const telHref = `tel:${phone.replace(/[^\d+]/g, '')}`;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <>
      <Helmet>
        <title>Contact - {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content="Contact Alexandra Diz for interior architecture and residential design inquiries." />
      </Helmet>

      <motion.main className={styles.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p>Start a project</p>
            <h1>Bring the home into focus before the renovation begins.</h1>
          </div>

          <figure className={styles.portrait}>
            <img
              src={getPreviewImageUrl(alexandraImage)}
              alt="Alexandra Diz in a finished interior"
              onError={(event) => handlePreviewFallback(event, alexandraImage)}
            />
            <figcaption>
              <span>Alexandra Diz</span>
              <strong>Interior architecture with a clear point of view.</strong>
            </figcaption>
          </figure>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formTitle}>
              <p>Project note</p>
              <h2>Tell Alexandra what the home needs to become.</h2>
            </div>

            {submitted && (
              <div className={styles.success}>
                Thank you. Your message has been sent.
              </div>
            )}

            <label>
              <span>Your name</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              />
            </label>
            <label>
              <span>Your e-mail *</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              />
            </label>
            <label>
              <span>Your message</span>
              <textarea
                name="message"
                rows={6}
                value={formData.message}
                onChange={(event) => setFormData({ ...formData, message: event.target.value })}
              />
            </label>
            <button type="submit">Send message</button>
          </form>

          <div className={styles.contactMethods} aria-label="Contact methods">
            <a href={telHref}>
              <span>Call</span>
              <strong>{phone}</strong>
            </a>
            <a href={`mailto:${email}`}>
              <span>Email</span>
              <strong>{email}</strong>
            </a>
          </div>
        </section>
      </motion.main>
    </>
  );
}
