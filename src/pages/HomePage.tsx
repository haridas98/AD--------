import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import type { Category, Project } from '../types';
import { collectProjectImages, parseProjectContent } from '../lib/projectBlockTemplates';
import { getCanonicalPortfolioProjectPathForCategory } from '../lib/portfolioRoutes';
import { sortProjectsForPortfolio } from '../lib/projectOrdering';
import { getPreviewImageUrl, handlePreviewFallback } from '../lib/imageUrls';
import { studioTestimonials } from '../content/testimonials';
import styles from './HomePage.module.scss';

const founderImage = '/home/Alexandra-2.jpg';
const portraitImage = '/home/alexandra.jpg';

const disciplines = [
  'Interior architecture',
  'Kitchen planning',
  'Bathroom design',
  'Full-home remodels',
];

const process = [
  ['01', 'Listen'],
  ['02', 'Edit'],
  ['03', 'Detail'],
  ['04', 'Reveal'],
];

function getProjectCover(project: Project) {
  const blocks = parseProjectContent(project.content);
  return collectProjectImages(blocks)[0] || '';
}

function getCategoryLabel(project: Project, categoryMap: Map<string, Category>) {
  return categoryMap.get(project.categoryId)?.name || 'Project';
}

function useRotatingIndex(length: number, delay = 6500) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (length < 2) return undefined;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % length), delay);
    return () => window.clearInterval(timer);
  }, [delay, length]);

  return [index, setIndex] as const;
}

export default function HomePage() {
  const { site, categories, projects } = useAppStore();
  const { scrollYProgress } = useScroll();
  const portraitY = useTransform(scrollYProgress, [0, 0.35], ['0%', '7%']);
  const textY = useTransform(scrollYProgress, [0, 0.28], ['0%', '-5%']);
  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const selectedProjects = useMemo(
    () => sortProjectsForPortfolio(projects.filter((project) => project.isPublished && !project.deletedAt)).slice(0, 6),
    [projects],
  );
  const [testimonialIndex, setTestimonialIndex] = useRotatingIndex(studioTestimonials.length);
  const activeTestimonial = studioTestimonials[testimonialIndex] || studioTestimonials[0];
  const heroProjectImage = selectedProjects[0] ? getProjectCover(selectedProjects[0]) : '';
  const materialImages = selectedProjects.map(getProjectCover).filter(Boolean).slice(0, 3);

  return (
    <>
      <Helmet>
        <title>{site?.name || 'Alexandra Diz'} - Interior Architecture</title>
        <meta
          name="description"
          content="Alexandra Diz creates considered residential interiors with calm composition and practical remodel direction."
        />
      </Helmet>

      <main className={styles.page}>
        <section className={styles.hero} data-home-hero="immersive">
          <motion.div
            className={styles.heroPortrait}
            style={{ y: portraitY }}
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={founderImage} alt="Alexandra Diz in a finished kitchen interior" />
          </motion.div>

          <motion.div
            className={styles.heroContent}
            style={{ y: textY }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <span className={styles.kicker}>Alexandra Diz / Interior designer</span>
            <h1>Quiet interiors with a clear point of view.</h1>
            <p>Homes edited with restraint, warmth, and the practical discipline of real remodeling.</p>
            <div className={styles.heroActions}>
              <Link to="/projects">View portfolio</Link>
              <Link to="/contact">Start a project</Link>
            </div>
          </motion.div>

          <motion.div
            className={styles.heroMini}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            <span>Studio note</span>
            <p>Design should feel composed before it feels decorated.</p>
          </motion.div>
        </section>

        <section className={styles.quoteSection}>
          <motion.p
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.7 }}
          >
            Alexandra makes homes feel intentional without making them feel staged.
          </motion.p>
        </section>

        <section className={styles.studioSection}>
          <motion.div
            className={styles.studioImage}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-12%' }}
            transition={{ duration: 0.75 }}
          >
            <img src={portraitImage} alt="Alexandra Diz portrait" />
          </motion.div>
          <div className={styles.studioText}>
            <span className={styles.kicker}>The studio</span>
            <h2>Personal direction. Practical execution.</h2>
            <p>
              A remodel has many decisions. Alexandra reduces them into one calm line: proportion,
              material, light, storage, and the feeling a room leaves behind.
            </p>
            <div className={styles.disciplineList}>
              {disciplines.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
        </section>

        <section className={styles.workSection}>
          <div className={styles.sectionHead}>
            <span className={styles.kicker}>Selected work</span>
            <h2>Rooms with restraint.</h2>
            <Link to="/projects">All projects</Link>
          </div>

          <div className={styles.workGrid}>
            {selectedProjects.slice(0, 4).map((project, index) => {
              const image = getProjectCover(project) || heroProjectImage || founderImage;
              return (
                <motion.article
                  key={project.id}
                  className={index === 0 ? styles.workItemWide : undefined}
                  initial={{ opacity: 0, y: 34 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ duration: 0.65, delay: index * 0.06 }}
                >
                  <Link to={getCanonicalPortfolioProjectPathForCategory(categoryMap.get(project.categoryId), project.slug)}>
                    <img
                      src={getPreviewImageUrl(image)}
                      alt={project.title}
                      onError={(event) => handlePreviewFallback(event, image)}
                    />
                    <span>{getCategoryLabel(project, categoryMap)}</span>
                    <h3>{project.title}</h3>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className={styles.materialSection}>
          <div>
            <span className={styles.kicker}>Material language</span>
            <h2>Soft contrast, honest texture, edited detail.</h2>
          </div>
          <div className={styles.materialStrip}>
            {(materialImages.length ? materialImages : [founderImage, portraitImage, heroProjectImage || founderImage]).map((image, index) => (
              <motion.img
                key={`${image}-${index}`}
                src={getPreviewImageUrl(image)}
                alt=""
                onError={(event) => handlePreviewFallback(event, image)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
              />
            ))}
          </div>
        </section>

        <section className={styles.processSection}>
          <span className={styles.kicker}>Process</span>
          <div className={styles.processRow}>
            {process.map(([number, label]) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.5 }}
              >
                <span>{number}</span>
                <strong>{label}</strong>
              </motion.div>
            ))}
          </div>
        </section>

        <section className={styles.testimonialSection}>
          <span className={styles.kicker}>Clients</span>
          <motion.blockquote
            key={testimonialIndex}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            "{activeTestimonial.text}"
          </motion.blockquote>
          <div className={styles.testimonialMeta}>
            <span>{activeTestimonial.author}</span>
            <div>
              {studioTestimonials.map((item, index) => (
                <button
                  key={`${item.author}-${index}`}
                  type="button"
                  className={index === testimonialIndex ? styles.activeDot : undefined}
                  aria-label={`Show testimonial ${index + 1}`}
                  onClick={() => setTestimonialIndex(index)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.finalSection}>
          <h2>Bring the house. Alexandra will find the line.</h2>
          <Link to="/contact">Book a conversation</Link>
        </section>
      </main>
    </>
  );
}
