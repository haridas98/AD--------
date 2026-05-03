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

const heroImage = '/home/Alexandra-2.jpg';
const portraitImage = '/home/alexandra.jpg';

const statements = [
  'Interior architecture',
  'Material direction',
  'Remodel clarity',
  'California homes',
];

const studioValues = [
  ['01', 'Less noise'],
  ['02', 'Better proportion'],
  ['03', 'Rooms that feel finished'],
];

function getProjectCover(project: Project) {
  const blocks = parseProjectContent(project.content);
  return collectProjectImages(blocks)[0] || '';
}

function getCategoryLabel(project: Project, categoryMap: Map<string, Category>) {
  return categoryMap.get(project.categoryId)?.name || 'Project';
}

function useRotatingIndex(length: number, delay = 7200) {
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
  const imageScale = useTransform(scrollYProgress, [0, 0.32], [1, 1.08]);
  const heroTextY = useTransform(scrollYProgress, [0, 0.28], ['0%', '-18%']);
  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const selectedProjects = useMemo(
    () => sortProjectsForPortfolio(projects.filter((project) => project.isPublished && !project.deletedAt)).slice(0, 5),
    [projects],
  );
  const [testimonialIndex, setTestimonialIndex] = useRotatingIndex(studioTestimonials.length);
  const activeTestimonial = studioTestimonials[testimonialIndex] || studioTestimonials[0];
  const fallbackProjectImage = selectedProjects[0] ? getProjectCover(selectedProjects[0]) : heroImage;

  return (
    <>
      <Helmet>
        <title>{site?.name || 'Alexandra Diz'} - Interior Architecture</title>
        <meta
          name="description"
          content="Alexandra Diz designs calm, personal interiors with architectural clarity and refined material direction."
        />
      </Helmet>

      <main className={styles.page}>
        <section className={styles.hero} data-home-hero="immersive">
          <motion.img
            className={styles.heroImage}
            src={heroImage}
            alt="Alexandra Diz in a completed interior project"
            style={{ scale: imageScale }}
          />
          <div className={styles.heroVeil} />
          <motion.div
            className={styles.heroCopy}
            style={{ y: heroTextY }}
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <span>Alexandra Diz / Interior Designer</span>
            <h1>Interiors with presence.</h1>
            <p>Personal homes, edited with taste and built with discipline.</p>
          </motion.div>
          <motion.div
            className={styles.heroActions}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            <Link to="/projects">Portfolio</Link>
            <Link to="/contact">Contact</Link>
          </motion.div>
        </section>

        <section className={styles.manifesto}>
          <motion.p
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.75 }}
          >
            A designer-led studio for homes that need calm, confidence, and a point of view.
          </motion.p>
        </section>

        <section className={styles.founder}>
          <motion.div
            className={styles.founderImage}
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
            viewport={{ once: true, margin: '-12%' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={portraitImage} alt="Portrait of Alexandra Diz" />
          </motion.div>
          <div className={styles.founderCopy}>
            <span>About the founder</span>
            <h2>Alexandra translates remodel pressure into visual clarity.</h2>
            <ul>
              {studioValues.map(([number, label]) => (
                <li key={label}>
                  <small>{number}</small>
                  <strong>{label}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.disciplineBar} aria-label="Studio disciplines">
          {statements.map((item) => <span key={item}>{item}</span>)}
        </section>

        <section className={styles.work}>
          <div className={styles.sectionIntro}>
            <span>Selected portfolio</span>
            <h2>Homes, edited.</h2>
            <Link to="/projects">View all projects</Link>
          </div>

          <div className={styles.workGrid}>
            {selectedProjects.slice(0, 4).map((project, index) => {
              const image = getProjectCover(project) || fallbackProjectImage;
              return (
                <motion.article
                  key={project.id}
                  className={index === 0 ? styles.workLarge : undefined}
                  initial={{ opacity: 0, y: 34 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ duration: 0.62, delay: index * 0.05 }}
                >
                  <Link to={getCanonicalPortfolioProjectPathForCategory(categoryMap.get(project.categoryId), project.slug)}>
                    <img
                      src={getPreviewImageUrl(image)}
                      alt={project.title}
                      onError={(event) => handlePreviewFallback(event, image)}
                    />
                    <div>
                      <span>{getCategoryLabel(project, categoryMap)}</span>
                      <h3>{project.title}</h3>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className={styles.testimonials}>
          <span>Client words</span>
          <motion.blockquote
            key={testimonialIndex}
            initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55 }}
          >
            "{activeTestimonial.text}"
          </motion.blockquote>
          <div className={styles.testimonialNav}>
            <strong>{activeTestimonial.author}</strong>
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

        <section className={styles.closing}>
          <div>
            <span>Start</span>
            <h2>Let the house become quieter.</h2>
          </div>
          <Link to="/contact">Book a conversation</Link>
        </section>
      </main>
    </>
  );
}
