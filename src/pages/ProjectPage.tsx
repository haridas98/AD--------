import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import Lightbox from '../components/Lightbox';
import { useAppStore } from '../store/useAppStore';

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { getProjectBySlug, getCategoryById, site } = useAppStore();

  const project = getProjectBySlug(slug || '');
  const category = project ? getCategoryById(project.categoryId) : null;

  if (!project) {
    return <Navigate to="/" replace />;
  }

  const allImages = [project.coverImage, ...(project.gallery || [])].filter(
    Boolean
  );

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>{project.title} — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={project.summary} />
        <meta property="og:title" content={project.title} />
        <meta property="og:description" content={project.summary} />
        {project.coverImage && (
          <meta property="og:image" content={project.coverImage} />
        )}
      </Helmet>

      <motion.main
        className="project-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Hero */}
        <section className="project-hero">
          <img
            src={project.coverImage}
            alt={project.title}
            className="project-hero-image"
          />
          <div className="project-hero-overlay" />
          <div className="container project-hero-content">
            <p className="eyebrow">{category?.name || 'Project'}</p>
            <h1>{project.title}</h1>
            <p>{project.summary}</p>
          </div>
        </section>

        {/* Content */}
        <section className="container project-content">
          <motion.div
            className="project-meta"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            {project.location && (
              <p>
                <strong>Location:</strong> {project.location}
              </p>
            )}
            {project.year && (
              <p>
                <strong>Year:</strong> {project.year}
              </p>
            )}
          </motion.div>

          {project.workDone && (
            <motion.div
              className="project-description"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h2>What was done</h2>
              <p>{project.workDone}</p>
            </motion.div>
          )}
        </section>

        {/* Gallery */}
        {project.gallery && project.gallery.length > 0 && (
          <section className="container gallery-grid">
            {allImages.map((img, i) => (
              <motion.img
                key={`${project.id}-${i}`}
                src={img}
                alt={`${project.title} - image ${i + 1}`}
                loading="lazy"
                onClick={() => openLightbox(i)}
                style={{ cursor: 'pointer' }}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                whileHover={{ scale: 1.02 }}
              />
            ))}
          </section>
        )}

        {/* Lightbox */}
        {lightboxOpen && (
          <Lightbox
            images={allImages}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
            onNavigate={setLightboxIndex}
          />
        )}
      </motion.main>
    </>
  );
}
