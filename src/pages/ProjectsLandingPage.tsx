import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { getPreviewImageUrl, handlePreviewFallback } from '../lib/imageUrls';
import {
  getCanonicalPortfolioCategoryPathForCategory,
  getCanonicalPortfolioProjectPathForCategory,
} from '../lib/portfolioRoutes';
import { collectProjectImages, parseProjectContent } from '../lib/projectBlockTemplates';
import { getProjectDisplayYear, getProjectImageCount, sortProjectsForPortfolio } from '../lib/projectOrdering';
import { useAppStore } from '../store/useAppStore';
import type { Category, Project } from '../types';
import styles from './ProjectsLandingPage.module.scss';

type ProjectPreview = {
  project: Project;
  category?: Category;
  image: string;
};

function getProjectCover(project: Project) {
  return project.coverImage
    || (project.assets || []).find((asset) => asset.kind === 'image' && asset.status === 'active' && asset.publicUrl)?.publicUrl
    || collectProjectImages(parseProjectContent(project.content))[0]
    || '';
}

function getShortTitle(title?: string | null) {
  const value = String(title || '').trim();
  if (!value) return 'Project';

  return (
    value
      .replace(/\s*\([^)]*\)\s*/g, ' ')
      .split(/[,:|]/)[0]
      .replace(/\s+in\s+[A-Z].*$/u, '')
      .replace(/\s{2,}/g, ' ')
      .trim() || value
  );
}

function getProjectMeta(project: Project, category?: Category) {
  const year = getProjectDisplayYear(project);
  return [category?.name, project.cityName, year || null].filter(Boolean).join(' / ');
}

function getCountText(count: number) {
  return count === 1 ? '1 project' : `${count} projects`;
}

export default function ProjectsLandingPage() {
  const { site, categories, projects } = useAppStore();
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [heroSpotlight, setHeroSpotlight] = useState({ x: 50, y: 50 });

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const publishedProjects = useMemo(
    () => sortProjectsForPortfolio(projects.filter((project) => project.isPublished && !project.deletedAt)),
    [projects],
  );

  const projectPreviews = useMemo<ProjectPreview[]>(() => (
    publishedProjects
      .filter((project) => project.isFeatured || getProjectImageCount(project) >= 8)
      .map((project) => ({
        project,
        category: categoryMap.get(project.categoryId),
        image: getProjectCover(project),
      }))
      .filter((item) => item.image)
  ), [categoryMap, publishedProjects]);

  const heroProjects = useMemo(() => {
    return projectPreviews.slice(0, 8);
  }, [projectPreviews]);

  const categoryGroups = useMemo(() => (
    [...categories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => {
        const categoryProjects = projectPreviews.filter(({ project }) => project.categoryId === category.id);
        return {
          category,
          lead: categoryProjects[0],
          projects: categoryProjects.slice(1, 7),
          count: categoryProjects.length,
        };
      })
      .filter((group) => group.lead)
  ), [categories, projectPreviews]);

  useEffect(() => {
    if (heroProjects.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setActiveHeroIndex((index) => (index + 1) % heroProjects.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [heroProjects.length]);

  useEffect(() => {
    if (!heroProjects.length) return;
    setActiveHeroIndex((index) => Math.min(index, heroProjects.length - 1));
  }, [heroProjects.length]);

  const activeHero = heroProjects[activeHeroIndex] || heroProjects[0];
  const heroPreviewItems = heroProjects.length <= 4
    ? heroProjects.map((item, index) => ({ ...item, index }))
    : Array.from({ length: 4 }, (_, offset) => {
      const index = (activeHeroIndex + offset) % heroProjects.length;
      return { ...heroProjects[index], index };
    });

  return (
    <>
      <Helmet>
        <title>Projects - {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content="Residential interiors and architecture projects by Alexandra Diz." />
      </Helmet>

      <main className={styles.page}>
        {activeHero ? (
          <section className={styles.hero}>
            <motion.div
              className={styles.heroCopy}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p>Portfolio</p>
              <h1>Real homes, edited with light and restraint.</h1>
              <nav className={styles.categoryLinks} aria-label="Project categories">
                {categoryGroups.slice(0, 6).map(({ category, count }) => (
                  <Link key={category.id} to={getCanonicalPortfolioCategoryPathForCategory(category)}>
                    <span>{category.name}</span>
                    <small>{getCountText(count)}</small>
                  </Link>
                ))}
              </nav>
            </motion.div>

            <Link
              className={styles.heroFeature}
              to={getCanonicalPortfolioProjectPathForCategory(activeHero.category, activeHero.project.slug)}
              style={{
                '--spotlight-x': `${heroSpotlight.x}%`,
                '--spotlight-y': `${heroSpotlight.y}%`,
              } as CSSProperties}
              onPointerMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setHeroSpotlight({
                  x: ((event.clientX - rect.left) / rect.width) * 100,
                  y: ((event.clientY - rect.top) / rect.height) * 100,
                });
              }}
              onPointerLeave={() => setHeroSpotlight({ x: 50, y: 50 })}
            >
              <motion.img
                key={activeHero.project.id}
                src={getPreviewImageUrl(activeHero.image)}
                alt={activeHero.project.title}
                onError={(event) => handlePreviewFallback(event, activeHero.image)}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
              <span className={styles.heroCounter}>
                {String(activeHeroIndex + 1).padStart(2, '0')} / {String(heroProjects.length).padStart(2, '0')}
              </span>
              <span className={styles.heroAction}>View project</span>
              <strong>{getShortTitle(activeHero.project.title)}</strong>
              <small>{getProjectMeta(activeHero.project, activeHero.category)}</small>
            </Link>

            <div className={styles.heroPreviewStack} aria-label="Featured project selector">
              {heroPreviewItems.map(({ project, image, index }) => (
                <button
                  key={project.id}
                  type="button"
                  className={index === activeHeroIndex ? styles.heroPreviewActive : undefined}
                  onClick={() => setActiveHeroIndex(index)}
                  aria-label={`Show ${project.title}`}
                >
                  <img
                    src={getPreviewImageUrl(image)}
                    alt=""
                    loading="lazy"
                    onError={(event) => handlePreviewFallback(event, image)}
                  />
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className={styles.empty}>
            <h1>Projects</h1>
          </section>
        )}

        <section className={styles.sections} aria-label="Project collections">
          {categoryGroups.map(({ category, lead, projects: supportingProjects, count }, sectionIndex) => (
            <motion.article
              key={category.id}
              className={styles.section}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-12%' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.sectionIntro}>
                <span>{String(sectionIndex + 1).padStart(2, '0')}</span>
                <h2>{category.name}</h2>
                <p>{getCountText(count)}</p>
                <Link to={getCanonicalPortfolioCategoryPathForCategory(category)}>See section</Link>
              </div>

              {lead ? (
                <div className={styles.collection}>
                  <Link
                    className={styles.leadProject}
                    to={getCanonicalPortfolioProjectPathForCategory(category, lead.project.slug)}
                  >
                    <img
                      src={getPreviewImageUrl(lead.image)}
                      alt={lead.project.title}
                      onError={(event) => handlePreviewFallback(event, lead.image)}
                    />
                    <span>{String(sectionIndex + 1).padStart(2, '0')}</span>
                    <strong>{getShortTitle(lead.project.title)}</strong>
                    <small>{getProjectMeta(lead.project, category)}</small>
                  </Link>

                  {supportingProjects.length ? (
                    <div className={styles.projectRail}>
                      {supportingProjects.map(({ project, image }, index) => (
                        <Link
                          key={project.id}
                          className={styles.projectTile}
                          to={getCanonicalPortfolioProjectPathForCategory(category, project.slug)}
                        >
                          <img
                            src={getPreviewImageUrl(image)}
                            alt={project.title}
                            onError={(event) => handlePreviewFallback(event, image)}
                          />
                          <span>{String(index + 2).padStart(2, '0')}</span>
                          <strong>{getShortTitle(project.title)}</strong>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </motion.article>
          ))}
        </section>
      </main>
    </>
  );
}
