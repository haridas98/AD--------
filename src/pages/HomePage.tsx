import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import ProjectGrid from '../components/ProjectGrid';
import { useAppStore } from '../store/useAppStore';

export default function HomePage() {
  const { categories, getFeaturedProjects, site } = useAppStore();

  // Get first available cover image for hero
  const allProjects = useAppStore.getState().projects;
  const heroImage = allProjects[0]?.coverImage || '';

  return (
    <>
      <Helmet>
        <title>Projects — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content="Interior Architecture & Remodeling projects by Alexandra Diz" />
      </Helmet>

      {/* Hero Section — dark, full-width like original */}
      <motion.section
        className="hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="hero-bg">
          {heroImage && <img src={heroImage} alt="Hero" />}
        </div>
        <div className="hero-inner">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Interior Architecture & Remodeling
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Refined California interiors with practical planning, material
            clarity, and timeless detail.
          </motion.p>
        </div>
      </motion.section>

      {/* Sections — dark style */}
      <section className="container home-sections">
        {categories.map((category) => {
          const featured = getFeaturedProjects(category.id);
          if (!featured.length) return null;

          return (
            <motion.div
              key={category.id}
              className="section-block"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5 }}
            >
              <div className="section-head">
                <h2>{category.homeTitle || category.name}</h2>
                <Link to={`/section/${category.id}`} className="btn-secondary">
                  See all
                </Link>
              </div>
              <ProjectGrid projects={featured} />
            </motion.div>
          );
        })}
      </section>
    </>
  );
}
