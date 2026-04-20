import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { PortfolioLeadCard } from '../components/PortfolioLeadCard';
import { PortfolioProjectCard } from '../components/PortfolioProjectCard';
import { fadeInUp, heroBody, heroCta, heroTitle, slowTransition, staggerContainer, viewportOnce } from '../lib/motion';
import styles from './HomePage.module.scss';

export default function HomePage() {
  const { categories, projects, site } = useAppStore();
  const [slide, setSlide] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const featured = projects.filter((p) => p.isFeatured && p.isPublished);

  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, [featured.length]);

  function getCover(p: any) {
    const c = typeof p.content === 'string' ? JSON.parse(p.content) : p.content;
    return c?.find((b: any) => b.type === 'heroImage')?.data?.image || '';
  }

  function getCategorySlug(catId: string) {
    const map: Record<string, string> = {
      kitchens: '/kitchens',
      'full-house-remodeling': '/full-house-remodeling',
      bathrooms: '/bathrooms',
      adu1: '/adu1',
      'projects-before-and-after': '/projects-before-and-after',
      fireplaces: '/fireplaces',
    };
    return map[catId] || `/${catId}`;
  }

  function getProjectLink(project: any) {
    return `${getCategorySlug(project.categoryId)}/${project.slug}`;
  }

  function getHeroSubtitle(project: any) {
    return [project.cityName, project.year].filter(Boolean).join(' • ') || 'Selected interior architecture project';
  }

  return (
    <>
      <Helmet>
        <title>{site?.name || 'Alexandra Diz'} — Interior Architecture & Remodeling</title>
        <meta name="description" content="Refined California interiors with practical planning, material clarity, and timeless detail." />
      </Helmet>

      {/* Hero Slider */}
      <section className="hero-slider" onClick={(e) => {
        if (featured.length < 2) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width * 0.3) setSlide((s) => (s - 1 + featured.length) % featured.length);
        else if (x > rect.width * 0.7) setSlide((s) => (s + 1) % featured.length);
      }}>
        <AnimatePresence mode="wait">
          {featured.length > 0 && (
            <motion.div key={slide} className="hero-slider-slide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
              <motion.img
                src={getCover(featured[slide])}
                alt={featured[slide].title}
                initial={shouldReduceMotion ? false : { scale: 1 }}
                animate={shouldReduceMotion ? undefined : { scale: 1.05 }}
                transition={shouldReduceMotion ? undefined : slowTransition}
              />
              <div className="hero-slider-overlay" />
              <motion.div
                className="container hero-slider-content"
                variants={staggerContainer(0.12, 0.05)}
                initial="hidden"
                animate="visible"
              >
                <motion.h1 variants={heroTitle}>{featured[slide].title}</motion.h1>
                <motion.p variants={heroBody} className="hero-slider-copy">
                  {getHeroSubtitle(featured[slide])}
                </motion.p>
                <motion.div variants={heroCta}>
                  <Link to={getProjectLink(featured[slide])} className="btn-primary" onClick={(e) => e.stopPropagation()}>View Project</Link>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {featured.length > 1 && (
          <div className="hero-slider-dots">
            {featured.map((_, i) => (
              <button key={i} className={`hero-slider-dot${slide === i ? ' active' : ''}`} onClick={(e) => { e.stopPropagation(); setSlide(i); }} />
            ))}
          </div>
        )}
      </section>

      {/* Category Sections — Project Cards */}
      <section className={styles.sections}>
        {categories.map((category) => {
          const catProjects = projects.filter((p) => p.categoryId === category.id && p.isPublished);
          if (!catProjects.length) return null;
          const projectsWithCover = catProjects.filter((project) => getCover(project));
          const leadProject = projectsWithCover.find((project) => project.isFeatured) || projectsWithCover[0];
          const supportingProjects = projectsWithCover.filter((project) => project.id !== leadProject?.id).slice(0, 4);
          if (!leadProject) return null;

          return (
            <motion.div
              key={category.id}
              className={styles.section}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              <div className="page-shell">
                <div className="page-shell__portfolio">
                  <div className={styles.sectionHead}>
                    <h2>{category.name}</h2>
                    <Link to={getCategorySlug(category.id)} className="btn-see-more">
                      <span>See more {category.name.toLowerCase()}</span>
                      <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><path d="M1 6h22M18 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </Link>
                  </div>

                  <PortfolioLeadCard
                    to={getProjectLink(leadProject)}
                    title={leadProject.title}
                    image={getCover(leadProject)}
                    categoryName={category.name}
                    cityName={leadProject.cityName}
                    year={leadProject.year}
                  />

                  {supportingProjects.length > 0 && (
                    <div className={styles.supportingGrid}>
                      {supportingProjects.map((project) => (
                        <PortfolioProjectCard
                          key={project.id}
                          to={getProjectLink(project)}
                          title={project.title}
                          image={getCover(project)}
                          eyebrow={category.name}
                          cityName={project.cityName}
                          year={project.year}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>
    </>
  );
}
