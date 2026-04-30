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
const founderAltImage = '/home/alexandra.jpg';

const services = [
  'Interior architecture',
  'Kitchen remodeling',
  'Bathroom design',
  'Full-home transformation',
];

const process = [
  ['01', 'Read', 'She studies how the home should feel before deciding how it should look.'],
  ['02', 'Edit', 'Materials, proportions, and layouts are reduced to a clear direction.'],
  ['03', 'Build', 'Design decisions stay practical through construction and installation.'],
  ['04', 'Reveal', 'The final layer is calm, personal, and intentionally composed.'],
];

function getProjectCover(project: Project) {
  const blocks = parseProjectContent(project.content);
  return collectProjectImages(blocks)[0] || '';
}

function getCategoryLabel(project: Project, categoryMap: Map<string, Category>) {
  return categoryMap.get(project.categoryId)?.name || 'Project';
}

function useRotatingIndex(length: number, delay = 7000) {
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
  const heroImageY = useTransform(scrollYProgress, [0, 0.35], ['0%', '9%']);
  const heroTextY = useTransform(scrollYProgress, [0, 0.3], ['0%', '-8%']);
  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const featuredProjects = useMemo(
    () => sortProjectsForPortfolio(projects.filter((project) => project.isPublished && !project.deletedAt)).slice(0, 5),
    [projects],
  );
  const [testimonialIndex, setTestimonialIndex] = useRotatingIndex(studioTestimonials.length);
  const activeTestimonial = studioTestimonials[testimonialIndex] || studioTestimonials[0];
  const heroProject = featuredProjects[0];
  const heroProjectImage = heroProject ? getProjectCover(heroProject) : '';
  const projectTiles = featuredProjects.slice(0, 4);

  return (
    <>
      <Helmet>
        <title>{site?.name || 'Alexandra Diz'} - Interior Architecture</title>
        <meta
          name="description"
          content="Alexandra Diz creates calm, edited residential interiors with a strong design point of view."
        />
      </Helmet>

      <main className={styles.page}>
        <section className={styles.hero} data-home-hero="immersive">
          <motion.div className={styles.heroImageLayer} style={{ y: heroImageY }}>
            <img src={founderImage} alt="Alexandra Diz in an interior project" />
          </motion.div>
          <div className={styles.heroShade} />
          <motion.div
            className={styles.heroCopy}
            style={{ y: heroTextY }}
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className={styles.kicker}>Alexandra Diz / Interior Architecture</span>
            <h1>Homes with clarity, softness, and a point of view.</h1>
            <p>Residential interiors shaped by taste, discipline, and practical remodeling experience.</p>
            <div className={styles.heroActions}>
              <Link to="/projects" className={styles.primaryLink}>View Projects</Link>
              <Link to="/contact" className={styles.secondaryLink}>Book a Conversation</Link>
            </div>
          </motion.div>
          <div className={styles.heroAside} aria-hidden="true">
            <span>Designer-led remodels</span>
            <span>California homes</span>
          </div>
        </section>

        <section className={styles.statementSection}>
          <motion.p
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-12%' }}
            transition={{ duration: 0.7 }}
          >
            Alexandra turns remodel decisions into composed interiors: less noise, stronger choices, better rooms.
          </motion.p>
        </section>

        <section className={styles.founderSection}>
          <motion.div
            className={styles.portraitFrame}
            initial={{ clipPath: 'inset(12% 12% 12% 12%)', opacity: 0 }}
            whileInView={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={founderAltImage} alt="Alexandra Diz portrait" />
          </motion.div>
          <div className={styles.founderCopy}>
            <span className={styles.kicker}>Studio</span>
            <h2>Design that feels personal, but never accidental.</h2>
            <p>Alexandra leads the visual direction, material language, and remodel rhythm so each home feels resolved from the first impression to the final detail.</p>
            <div className={styles.serviceList}>
              {services.map((service) => <span key={service}>{service}</span>)}
            </div>
          </div>
        </section>

        <section className={styles.workSection}>
          <div className={styles.sectionHead}>
            <span className={styles.kicker}>Selected work</span>
            <h2>Proof, not presentation.</h2>
            <Link to="/projects">Open portfolio</Link>
          </div>
          <div className={styles.workGrid}>
            {projectTiles.map((project, index) => {
              const image = getProjectCover(project) || heroProjectImage || founderImage;
              return (
                <motion.div
                  key={project.id}
                  className={`${styles.projectTile} ${index === 0 ? styles.projectTileLarge : ''}`}
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
                    <strong>{project.title}</strong>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className={styles.processSection}>
          <div className={styles.processIntro}>
            <span className={styles.kicker}>Process</span>
            <h2>Steady, selective, deeply prepared.</h2>
          </div>
          <div className={styles.processGrid}>
            {process.map(([number, title, text]) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.55 }}
              >
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className={styles.testimonialSection}>
          <span className={styles.kicker}>Client words</span>
          <motion.blockquote
            key={testimonialIndex}
            initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55 }}
          >
            "{activeTestimonial.text}"
          </motion.blockquote>
          <div className={styles.testimonialFooter}>
            <div className={styles.testimonialAuthor}>
              {activeTestimonial.image ? <img src={activeTestimonial.image} alt={activeTestimonial.author} /> : <span />}
              <strong>{activeTestimonial.author}</strong>
              <small>{activeTestimonial.date}</small>
            </div>
            <div className={styles.testimonialDots}>
              {studioTestimonials.map((item, index) => (
                <button
                  key={`${item.author}-${index}`}
                  type="button"
                  className={index === testimonialIndex ? styles.testimonialDotActive : ''}
                  aria-label={`Show testimonial ${index + 1}`}
                  onClick={() => setTestimonialIndex(index)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.finalSection}>
          <div>
            <span className={styles.kicker}>Begin</span>
            <h2>Bring the house. She will find the line.</h2>
          </div>
          <Link to="/contact" className={styles.primaryLink}>Start Your Project</Link>
        </section>
      </main>
    </>
  );
}
