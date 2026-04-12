import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export default function HomePage() {
  const { categories, projects, site } = useAppStore();

  const featuredProjects = projects.filter((p) => p.isFeatured && p.isPublished);

  return (
    <>
      <Helmet>
        <title>{site?.name || 'Alexandra Diz'} — Interior Architecture & Remodeling</title>
        <meta name="description" content="Refined California interiors with practical planning, material clarity, and timeless detail." />
      </Helmet>

      {/* Hero */}
      <motion.section
        className="hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="hero-bg" />
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

      {/* Sections */}
      <section className="container home-sections">
        {categories.map((category) => {
          const categoryProjects = projects.filter(
            (p) => p.categoryId === category.id && p.isPublished
          );
          if (!categoryProjects.length) return null;

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
                <h2>{category.name}</h2>
                <Link to={`/category/${category.slug}`} className="btn-see-more">
                  <span>See more {category.name.toLowerCase()}</span>
                  <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                    <path d="M1 6h22M18 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>

              <div className="cards-grid">
                {categoryProjects.slice(0, 6).map((project, index) => {
                  const content = typeof project.content === 'string' ? JSON.parse(project.content) : project.content;
                  const heroBlock = content.find((b: any) => b.type === 'heroImage');
                  const coverImage = heroBlock?.data?.image || '';

                  return (
                    <motion.article
                      key={project.id}
                      className="project-card"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                    >
                      <Link to={`/project/${project.slug}`} className="project-image-wrap">
                        {coverImage && (
                          <img src={coverImage} alt={project.title} loading="lazy" />
                        )}
                      </Link>
                      <div className="project-body">
                        <h3>{project.title}</h3>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </section>
    </>
  );
}
