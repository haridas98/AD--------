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

const founderInProject = '/home/Alexandra-2.jpg';
const founderPortrait = '/home/alexandra.jpg';

const signatureWords = ['quiet authority', 'warm materials', 'exact proportions', 'rooms that breathe'];

const methodCards = [
  ['01', 'See', 'the hidden rhythm of the house'],
  ['02', 'Cut', 'the decisions that dilute the room'],
  ['03', 'Compose', 'light, storage, texture, and silence'],
];

const atmosphereCards = [
  ['Before the sketch', 'A room is read for pressure, habits, and the moments that need relief.'],
  ['During the build', 'The design stays legible while budgets, trades, and timing become real.'],
  ['After the reveal', 'The result should feel inevitable, not decorated.'],
];

function getProjectCover(project: Project) {
  const blocks = parseProjectContent(project.content);
  return collectProjectImages(blocks)[0] || '';
}

function getCategoryLabel(project: Project, categoryMap: Map<string, Category>) {
  return categoryMap.get(project.categoryId)?.name || 'Project';
}

function useRotatingIndex(length: number, delay = 6400) {
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
  const heroScale = useTransform(scrollYProgress, [0, 0.32], [1.02, 1.12]);
  const heroLift = useTransform(scrollYProgress, [0, 0.28], ['0%', '-14%']);
  const portraitShift = useTransform(scrollYProgress, [0.1, 0.55], ['8%', '-6%']);
  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const selectedProjects = useMemo(
    () => sortProjectsForPortfolio(projects.filter((project) => project.isPublished && !project.deletedAt)).slice(0, 6),
    [projects],
  );
  const projectImages = selectedProjects.map(getProjectCover).filter(Boolean);
  const visualPool = projectImages.length ? projectImages : [founderInProject, founderPortrait];
  const [testimonialIndex, setTestimonialIndex] = useRotatingIndex(studioTestimonials.length);
  const activeTestimonial = studioTestimonials[testimonialIndex] || studioTestimonials[0];

  return (
    <>
      <Helmet>
        <title>{site?.name || 'Alexandra Diz'} - Interior Design Studio</title>
        <meta
          name="description"
          content="Alexandra Diz creates composed residential interiors with clear spatial thinking, edited materials, and calm execution."
        />
      </Helmet>

      <main className={styles.page}>
        <section className={styles.hero} data-home-hero="immersive">
          <motion.img
            className={styles.heroImage}
            src={founderInProject}
            alt="Alexandra Diz inside a completed interior"
            style={{ scale: heroScale }}
          />
          <div className={styles.heroShade} />
          <motion.div className={styles.heroText} style={{ y: heroLift }}>
            <motion.span
              initial={{ opacity: 0, letterSpacing: '0.42em' }}
              animate={{ opacity: 1, letterSpacing: '0.2em' }}
              transition={{ duration: 0.9 }}
            >
              Alexandra Diz Studio
            </motion.span>
            <h1 aria-label="A home should feel inevitable.">
              {['A', 'home', 'should', 'feel', 'inevitable.'].map((word, index) => (
                <motion.i
                  key={word}
                  initial={{ opacity: 0, y: 34 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
                >
                  {word}
                </motion.i>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
            >
              Interior design for people who want fewer random choices and more rooms that make sense.
            </motion.p>
          </motion.div>
          <motion.div
            className={styles.heroActions}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
          >
            <Link to="/projects">Enter portfolio</Link>
            <Link to="/contact">Start quietly</Link>
          </motion.div>
        </section>

        <section className={styles.signal}>
          <div className={styles.marquee} aria-hidden="true">
            {[...signatureWords, ...signatureWords].map((word, index) => <span key={`${word}-${index}`}>{word}</span>)}
          </div>
        </section>

        <section className={styles.founder}>
          <motion.div className={styles.founderImage} style={{ y: portraitShift }}>
            <img src={founderPortrait} alt="Alexandra Diz portrait" />
          </motion.div>
          <div className={styles.founderText}>
            <span>Not a catalog. A point of view.</span>
            <h2>Alexandra designs the feeling first, then the room.</h2>
            <p>
              The work is measured, visual, and direct: choose what belongs, remove what competes,
              and make the home feel finished before the furniture arrives.
            </p>
          </div>
        </section>

        <section className={styles.method}>
          <div className={styles.methodIntro}>
            <span>Method</span>
            <h2>Three moves. No noise.</h2>
          </div>
          <div className={styles.methodGrid}>
            {methodCards.map(([number, title, text], index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-12%' }}
                transition={{ duration: 0.58, delay: index * 0.08 }}
              >
                <small>{number}</small>
                <strong>{title}</strong>
                <p>{text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className={styles.work}>
          <div className={styles.sectionHeader}>
            <span>Selected work</span>
            <h2>Proof of restraint.</h2>
            <Link to="/projects">All projects</Link>
          </div>
          <div className={styles.workGrid}>
            {selectedProjects.slice(0, 4).map((project, index) => {
              const image = getProjectCover(project) || visualPool[index % visualPool.length];
              return (
                <motion.article
                  key={project.id}
                  className={index === 0 ? styles.featuredWork : undefined}
                  initial={{ opacity: 0, clipPath: 'inset(10% 0 10% 0)' }}
                  whileInView={{ opacity: 1, clipPath: 'inset(0% 0 0% 0)' }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ duration: 0.75, delay: index * 0.06 }}
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

        <section className={styles.atmosphere}>
          {atmosphereCards.map(([title, text], index) => {
            const image = visualPool[index % visualPool.length];
            return (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-12%' }}
                transition={{ duration: 0.62, delay: index * 0.08 }}
              >
                <img
                  src={getPreviewImageUrl(image)}
                  alt=""
                  onError={(event) => handlePreviewFallback(event, image)}
                />
                <div>
                  <span>0{index + 1}</span>
                  <h2>{title}</h2>
                  <p>{text}</p>
                </div>
              </motion.article>
            );
          })}
        </section>

        <section className={styles.testimonial}>
          <span>Client signal</span>
          <motion.blockquote
            key={testimonialIndex}
            initial={{ opacity: 0, y: 22, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55 }}
          >
            "{activeTestimonial.text}"
          </motion.blockquote>
          <div>
            <strong>{activeTestimonial.author}</strong>
            <nav aria-label="Testimonials">
              {studioTestimonials.map((item, index) => (
                <button
                  key={`${item.author}-${index}`}
                  type="button"
                  className={index === testimonialIndex ? styles.activeDot : undefined}
                  aria-label={`Show testimonial ${index + 1}`}
                  onClick={() => setTestimonialIndex(index)}
                />
              ))}
            </nav>
          </div>
        </section>

        <section className={styles.final}>
          <h2>Bring the home. Leave with a direction.</h2>
          <Link to="/contact">Book a conversation</Link>
        </section>
      </main>
    </>
  );
}
