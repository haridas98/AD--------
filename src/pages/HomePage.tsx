import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { studioTestimonials } from '../content/testimonials';
import { getPreviewImageUrl, handlePreviewFallback } from '../lib/imageUrls';
import { getCanonicalPortfolioProjectPathForCategory } from '../lib/portfolioRoutes';
import { sortProjectsForPortfolio } from '../lib/projectOrdering';
import { useAppStore } from '../store/useAppStore';
import type { BlogPost, Category, Project } from '../types';
import styles from './HomePage.module.scss';

const founderImage = '/home/Alexandra-2.jpg';

const fallbackImages = [
  '/images/legacy/kitchen-3d-1.jpg',
  '/images/legacy/kitchen-3d-4.jpg',
  '/images/legacy/bath-3d-1.jpg',
  '/images/legacy/bath-3d-4.jpg',
  '/images/legacy/process-phase4-1.jpg',
  '/images/legacy/process-phase1-1.jpg',
];

const services = ['Interior Architecture', 'Kitchens', 'Bathrooms', 'Full Home'];
const heroImages = [fallbackImages[0], fallbackImages[1], fallbackImages[2], fallbackImages[3], fallbackImages[4]];

function isImageUrl(value: unknown): value is string {
  return typeof value === 'string' && /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(value);
}

function collectImages(value: unknown, images: string[] = []) {
  if (isImageUrl(value)) images.push(value);
  if (Array.isArray(value)) value.forEach((item) => collectImages(item, images));
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((item) => collectImages(item, images));
  }
  return images;
}

function getProjectImages(project: Project) {
  return [...new Set(collectImages(project.content))].filter(Boolean);
}

function getProjectCover(project: Project) {
  return getProjectImages(project)[0] || fallbackImages[0];
}

function getCategoryName(project: Project, categories: Category[]) {
  return categories.find((category) => category.id === project.categoryId)?.name || 'Project';
}

function getPostCover(post?: BlogPost) {
  return post?.coverImage || fallbackImages[2];
}

export default function HomePage() {
  const { site, projects, categories, blogPosts } = useAppStore();

  const featuredProjects = useMemo(
    () => sortProjectsForPortfolio(projects.filter((project) => project.isPublished !== false && !project.deletedAt)).slice(0, 4),
    [projects],
  );

  const visuals = useMemo(() => {
    const projectImages = featuredProjects.flatMap((project) => getProjectImages(project));
    return [...projectImages, ...fallbackImages].slice(0, 9);
  }, [featuredProjects]);

  const posts = useMemo(
    () => blogPosts.filter((post) => post.isPublished !== false).slice(0, 2),
    [blogPosts],
  );

  return (
    <>
      <Helmet>
        <title>{site?.name || 'Alexandra Diz'} - Interior Architecture</title>
        <meta name="description" content="Interior architecture and residential design by Alexandra Diz." />
      </Helmet>

      <main className={styles.page}>
        <section className={styles.hero}>
          <motion.div
            className={styles.heroText}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span>Alexandra Diz Interior Architecture</span>
            <h1>Warm, considered homes. Clearly directed.</h1>
            <p>Residential interiors shaped around proportion, material calm, and the way people actually live.</p>
            <Link to="/contact">Begin your project</Link>
          </motion.div>

          <div className={styles.heroMosaic} aria-label="Studio imagery">
            <motion.img src={founderImage} alt="Alexandra Diz in a completed interior" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.1 }} />
            {heroImages.slice(0, 5).map((image, index) => (
              <motion.img
                key={`${image}-${index}`}
                src={getPreviewImageUrl(image)}
                onError={(event) => handlePreviewFallback(event, image)}
                alt=""
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.16 + index * 0.05 }}
              />
            ))}
          </div>
        </section>

        <section className={styles.about}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-90px' }}
            transition={{ duration: 0.65 }}
          >
            <span>About the studio</span>
            <h2>Alexandra brings taste, order, and quiet confidence to residential remodels.</h2>
          </motion.div>
          <p>
            She helps clients make fewer, better decisions: layout, light, finishes, details, and the final feeling of the home.
          </p>
        </section>

        <section className={styles.services}>
          {services.map((service, index) => (
            <motion.article
              key={service}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-70px' }}
              transition={{ duration: 0.55, delay: index * 0.05 }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{service}</h3>
            </motion.article>
          ))}
        </section>

        <section className={styles.work}>
          <div className={styles.sectionHead}>
            <span>Selected projects</span>
            <Link to="/projects">View all</Link>
          </div>
          <div className={styles.workGrid}>
            {featuredProjects.map((project, index) => {
              const image = getProjectCover(project);
              return (
                <motion.article
                  key={project.id}
                  className={index === 0 ? styles.leadWork : undefined}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.58, delay: index * 0.05 }}
                >
                  <Link to={getCanonicalPortfolioProjectPathForCategory(project.categoryId, project.slug)}>
                    <img src={getPreviewImageUrl(image)} onError={(event) => handlePreviewFallback(event, image)} alt={project.title} />
                    <div>
                      <span>{getCategoryName(project, categories)}</span>
                      <h3>{project.title}</h3>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className={styles.detailStrip}>
          {visuals.slice(5, 9).map((image, index) => (
            <img
              key={`${image}-detail-${index}`}
              src={getPreviewImageUrl(image)}
              onError={(event) => handlePreviewFallback(event, image)}
              alt=""
            />
          ))}
        </section>

        <section className={styles.testimonials}>
          <span>Client words</span>
          <div>
            {studioTestimonials.slice(0, 2).map((testimonial) => (
              <article key={`${testimonial.author}-${testimonial.date}`}>
                <p>“{testimonial.text}”</p>
                <strong>{testimonial.author}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.journal}>
          <div className={styles.sectionHead}>
            <span>Journal</span>
            <Link to="/blog">Read notes</Link>
          </div>
          <div className={styles.postGrid}>
            {posts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`}>
                <img src={getPostCover(post)} alt={post.title} />
                <h3>{post.title}</h3>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.cta}>
          <span>Start</span>
          <h2>Tell Alexandra what the home needs to become.</h2>
          <Link to="/contact">Book a conversation</Link>
        </section>
      </main>
    </>
  );
}
