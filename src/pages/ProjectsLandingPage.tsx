import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { PortfolioLeadCard } from '../components/PortfolioLeadCard';
import { PortfolioProjectCard } from '../components/PortfolioProjectCard';
import {
  getCanonicalPortfolioCategoryPathForCategory,
  getCanonicalPortfolioProjectPathForCategory,
} from '../lib/portfolioRoutes';
import styles from './ProjectsLandingPage.module.scss';

export default function ProjectsLandingPage() {
  const { categories, projects, site } = useAppStore();
  const [slide, setSlide] = useState(0);
  const featured = projects.filter((project) => project.isFeatured && project.isPublished);

  useEffect(() => {
    if (featured.length < 2) return undefined;
    const timerId = window.setInterval(() => setSlide((value) => (value + 1) % featured.length), 5000);
    return () => window.clearInterval(timerId);
  }, [featured.length]);

  function getCover(project: any) {
    const content = typeof project.content === 'string' ? JSON.parse(project.content) : project.content;
    return content?.find((block: any) => block.type === 'heroImage')?.data?.image || '';
  }

  function getProjectCategory(project: any) {
    return categories.find((category) => category.id === project.categoryId || category.slug === project.categoryId);
  }

  return (
    <>
      <Helmet>
        <title>Projects - {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content="Refined California interiors with practical planning, material clarity, and timeless detail." />
      </Helmet>

      {featured.length > 0 ? (
        <section
          className="hero-slider"
          onClick={(event) => {
            if (featured.length < 2) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - rect.left;
            if (x < rect.width * 0.3) setSlide((value) => (value - 1 + featured.length) % featured.length);
            else if (x > rect.width * 0.7) setSlide((value) => (value + 1) % featured.length);
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              className="hero-slider-slide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <img src={getCover(featured[slide])} alt={featured[slide].title} />
              <div className="hero-slider-overlay" />
              <div className="container hero-slider-content">
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  {featured[slide].title}
                </motion.h1>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <Link
                    to={getCanonicalPortfolioProjectPathForCategory(getProjectCategory(featured[slide]), featured[slide].slug)}
                    className="btn-primary"
                    onClick={(event) => event.stopPropagation()}
                  >
                    View Project
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {featured.length > 1 ? (
            <div className="hero-slider-dots">
              {featured.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`hero-slider-dot${slide === index ? ' active' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSlide(index);
                  }}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className={styles.sections}>
        {categories.map((category) => {
          const catProjects = projects.filter((project) => project.categoryId === category.id && project.isPublished);
          if (!catProjects.length) return null;

          const projectsWithCover = catProjects.filter((project) => getCover(project));
          const leadProject = projectsWithCover.find((project) => project.isFeatured) || projectsWithCover[0];
          const supportingProjects = projectsWithCover.filter((project) => project.id !== leadProject?.id).slice(0, 4);
          if (!leadProject) return null;

          return (
            <motion.div
              key={category.id}
              className={styles.section}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="page-shell">
                <div className="page-shell__portfolio">
                  <div className={styles.sectionHead}>
                    <h2>{category.name}</h2>
                    <Link to={getCanonicalPortfolioCategoryPathForCategory(category)} className="btn-see-more">
                      <span>See more {category.name.toLowerCase()}</span>
                      <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                        <path d="M1 6h22M18 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </div>

                  <PortfolioLeadCard
                    to={getCanonicalPortfolioProjectPathForCategory(category, leadProject.slug)}
                    title={leadProject.title}
                    image={getCover(leadProject)}
                    categoryName={category.name}
                    cityName={leadProject.cityName}
                    year={leadProject.year}
                  />

                  {supportingProjects.length > 0 ? (
                    <div className={styles.supportingGrid}>
                      {supportingProjects.map((project) => (
                        <PortfolioProjectCard
                          key={project.id}
                          to={getCanonicalPortfolioProjectPathForCategory(category, project.slug)}
                          title={project.title}
                          image={getCover(project)}
                          eyebrow={category.name}
                          cityName={project.cityName}
                          year={project.year}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>
    </>
  );
}
