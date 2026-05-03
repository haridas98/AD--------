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
  '/images/legacy/process-phase4-1.jpg',
];

const services = [
  ['Interior Architecture', 'Planning, proportions, storage, lighting, and the logic of how a home should work.'],
  ['Kitchen Remodeling', 'Clean layouts, durable materials, refined finishes, and a kitchen that feels natural every day.'],
  ['Bathroom Design', 'Calm rooms with careful tile, stone, fixtures, and practical comfort built into the plan.'],
  ['Full Home Direction', 'A complete visual system for clients who want one clear point of view across the house.'],
];

const process = [
  ['01', 'Listen', 'We define how the house should feel before choosing finishes.'],
  ['02', 'Edit', 'The strongest ideas stay. Everything decorative without purpose leaves.'],
  ['03', 'Compose', 'Materials, light, layout, and details are balanced into one direction.'],
  ['04', 'Guide', 'The project stays readable from first concept to final installation.'],
];

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
  const contentImages = collectImages(project.content);
  return [...new Set(contentImages)].filter(Boolean);
}

function getProjectCover(project: Project) {
  return getProjectImages(project)[0] || fallbackImages[0];
}

function getCategoryName(project: Project, categories: Category[]) {
  return categories.find((category) => category.id === project.categoryId)?.name || project.categoryId;
}

function getPostCover(post?: BlogPost) {
  return post?.coverImage || fallbackImages[2];
}

export default function HomePage() {
  const { site, projects, categories, blogPosts } = useAppStore();

  const featuredProjects = useMemo(
    () =>
      sortProjectsForPortfolio(projects.filter((project) => project.isPublished !== false && !project.deletedAt))
        .slice(0, 5),
    [projects],
  );

  const visualImages = useMemo(() => {
    const projectImages = featuredProjects.flatMap((project) => getProjectImages(project)).slice(0, 8);
    return [...projectImages, ...fallbackImages].slice(0, 8);
  }, [featuredProjects]);

  const posts = useMemo(
    () => blogPosts.filter((post) => post.isPublished !== false).slice(0, 3),
    [blogPosts],
  );

  const leadProject = featuredProjects[0];
  const leadImage = leadProject ? getProjectCover(leadProject) : visualImages[0];
  const leadPreview = getPreviewImageUrl(leadImage);

  return (
    <>
      <Helmet>
        <title>{site?.name || 'Alexandra Diz'} - Interior Architecture</title>
        <meta
          name="description"
          content="Interior architecture and design direction by Alexandra Diz for considered private homes."
        />
      </Helmet>

      <main className={styles.page}>
        <section className={styles.hero}>
          <motion.div
            className={styles.heroCopy}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span>Alexandra Diz / Interior Architecture</span>
            <h1>Design direction for homes that feel personal and resolved.</h1>
            <p>
              Alexandra works with homeowners who want a calm, edited process: clear planning,
              thoughtful materials, and interiors that feel natural instead of over-designed.
            </p>
            <div className={styles.heroActions}>
              <Link to="/projects">View portfolio</Link>
              <Link to="/contact">Start a project</Link>
            </div>
          </motion.div>

          <motion.div
            className={styles.heroGallery}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
          >
            <img src={founderImage} alt="Alexandra Diz inside an interior project" />
            <img
              src={fallbackImages[0]}
              alt="Kitchen interior detail"
            />
            <img
              src={fallbackImages[2]}
              alt="Bathroom interior detail"
            />
          </motion.div>
        </section>

        <motion.section
          className={styles.intro}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65 }}
        >
          <span>Studio note</span>
          <p>
            The work begins with how the home should feel: calmer circulation, better light,
            stronger materials, and fewer decisions competing for attention.
          </p>
        </motion.section>

        <section className={styles.services}>
          {services.map(([title, text], index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-70px' }}
              transition={{ duration: 0.55, delay: index * 0.06 }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h2>{title}</h2>
              <p>{text}</p>
            </motion.article>
          ))}
        </section>

        <section className={styles.founder}>
          <motion.img
            src={founderImage}
            alt="Alexandra Diz in a kitchen interior"
            initial={{ opacity: 0, clipPath: 'inset(0 0 18% 0)' }}
            whileInView={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.65 }}
          >
            <span>About Alexandra</span>
            <h2>Design is not more decoration. It is better judgment.</h2>
            <p>
              Her role is to translate taste, lifestyle, construction limits, and budget into one
              calm direction. The result should feel personal without becoming noisy.
            </p>
          </motion.div>
        </section>

        <section className={styles.visualRail} aria-label="Selected studio details">
          {visualImages.slice(0, 4).map((image, index) => (
            <motion.img
              key={`${image}-${index}`}
              src={getPreviewImageUrl(image)}
              onError={(event) => handlePreviewFallback(event, image)}
              alt=""
              initial={{ opacity: 0, y: index % 2 ? 34 : -34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: index * 0.05 }}
            />
          ))}
        </section>

        <section className={styles.process}>
          <div className={styles.sectionHead}>
            <span>Process</span>
            <h2>A quieter way to make confident design decisions.</h2>
          </div>
          <div className={styles.processGrid}>
            {process.map(([number, title, text]) => (
              <article key={title}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.featured}>
          <div className={styles.sectionHead}>
            <span>Selected work</span>
            <h2>Portfolio as evidence, not decoration.</h2>
          </div>
          <div className={styles.projectGrid}>
            {featuredProjects.slice(0, 4).map((project, index) => {
              const image = getProjectCover(project);
              return (
                <motion.article
                  key={project.id}
                  className={index === 0 ? styles.projectLead : undefined}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.58, delay: index * 0.06 }}
                >
                  <Link to={getCanonicalPortfolioProjectPathForCategory(project.categoryId, project.slug)}>
                    <img
                      src={getPreviewImageUrl(image)}
                      onError={(event) => handlePreviewFallback(event, image)}
                      alt={project.title}
                    />
                    <div>
                      <span>{getCategoryName(project, categories)}</span>
                      <h3>{project.title}</h3>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </div>
          <Link className={styles.textLink} to="/projects">Open all projects</Link>
        </section>

        <section className={styles.quote}>
          <p>“A finished home should look inevitable, as if every decision had only one honest answer.”</p>
          <span>Alexandra Diz</span>
        </section>

        <section className={styles.testimonials}>
          <div className={styles.sectionHead}>
            <span>Client words</span>
            <h2>Short notes from real projects.</h2>
          </div>
          <div className={styles.testimonialGrid}>
            {studioTestimonials.slice(0, 3).map((testimonial) => (
              <article key={`${testimonial.author}-${testimonial.date}`}>
                <p>{testimonial.text}</p>
                <span>{testimonial.author}</span>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.journal}>
          <div className={styles.sectionHead}>
            <span>Journal</span>
            <h2>Design notes for clients preparing a remodel.</h2>
          </div>
          <div className={styles.postGrid}>
            {posts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`}>
                <img src={getPostCover(post)} alt={post.title} />
                <span>{post.publishedAt ? new Date(post.publishedAt).getFullYear() : 'Journal'}</span>
                <h3>{post.title}</h3>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.cta}>
          <img
            src={leadPreview}
            onError={(event) => handlePreviewFallback(event, leadImage)}
            alt=""
          />
          <div>
            <span>Next step</span>
            <h2>Bring the house. Alexandra will help find the direction.</h2>
            <Link to="/contact">Book a conversation</Link>
          </div>
        </section>
      </main>
    </>
  );
}
