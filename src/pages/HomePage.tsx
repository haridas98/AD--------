import { type MouseEvent, type PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AnimatePresence, motion } from 'framer-motion';
import { getPreviewImageUrl, handlePreviewFallback } from '../lib/imageUrls';
import { normalizeHomepageSettings } from '../lib/homepageSettings';
import { getCanonicalPortfolioProjectPathForCategory } from '../lib/portfolioRoutes';
import { collectProjectImages, parseProjectContent } from '../lib/projectBlockTemplates';
import { sortProjectsForPortfolio } from '../lib/projectOrdering';
import { useAppStore } from '../store/useAppStore';
import type { Category, HomepageImageValue, Project, Testimonial } from '../types';
import styles from './HomePage.module.scss';

const alexandra = {
  portrait: '/home/alexandra.jpg',
  onsite: '/home/Alexandra-2.jpg',
};

const fallbackImages = [
  '/images/legacy/kitchen-3d-3.jpeg',
  '/images/legacy/kitchen-3d-1.jpg',
  '/images/legacy/kitchen-3d-5.jpg',
  '/images/legacy/bath-3d-1.jpg',
  '/images/legacy/process-phase4-1.jpg',
  '/images/legacy/process-phase1-1.jpg',
  alexandra.onsite,
  alexandra.portrait,
];

function getProjectImages(project: Project) {
  const assetImages = (project.assets || [])
    .filter((asset) => asset.kind === 'image' && asset.status === 'active' && asset.publicUrl)
    .map((asset) => asset.publicUrl);
  const blocks = parseProjectContent(project.content);
  return Array.from(new Set([...assetImages, ...collectProjectImages(blocks)]));
}

function getProjectCover(project: Project) {
  return getProjectImages(project)[0] || '';
}

function getProjectPath(project: Project, categoryMap: Map<string, Category>) {
  return getCanonicalPortfolioProjectPathForCategory(categoryMap.get(project.categoryId), project.slug);
}

function resolveTestimonialProject(
  testimonial: Testimonial,
  projects: Project[],
  categoryMap: Map<string, Category>,
) {
  if (testimonial.projectId) {
    const project = projects.find((item) => item.id === testimonial.projectId);
    if (project) {
      return {
        href: getProjectPath(project, categoryMap),
        label: testimonial.projectText || 'View project',
        external: false,
        project,
      };
    }
  }

  const href = testimonial.projectHref;
  if (!href || href === '#') return null;

  const legacySlug = href.split('/').filter(Boolean).pop();
  const project = projects.find((item) => item.slug === legacySlug);

  if (project) {
    return {
      href: getProjectPath(project, categoryMap),
      label: testimonial.projectText || 'View project',
      external: false,
      project,
    };
  }

  return {
    href,
    label: testimonial.projectText || 'View project',
    external: /^https?:\/\//i.test(href),
    project: null,
  };
}

function getSourceLogo(label?: string | null) {
  const value = String(label || '').toLowerCase();
  if (value.includes('linkedin')) return 'in';
  if (value.includes('houzz')) return 'H';
  return 'EXT';
}

function getSourceLabel(label?: string | null) {
  return String(label || 'Source').replace(/^@/, '');
}

function getShortProjectTitle(title?: string | null) {
  const value = String(title || '').trim();
  if (!value) return 'Project';

  const withoutLocation = value
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .split(/[,:|]/)[0]
    .replace(/\s+in\s+[A-Z].*$/u, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return withoutLocation || value;
}

function getProjectImageRef(project: Project): HomepageImageValue | null {
  const url = getProjectCover(project);
  if (!url) return null;

  return {
    url,
    projectId: project.id,
    alt: getShortProjectTitle(project.title),
  };
}

function getHomepageImageUrl(value?: HomepageImageValue | null) {
  if (!value) return '';
  return typeof value === 'string' ? value : value.url || '';
}

function getHomepageImageProjectId(value?: HomepageImageValue | null) {
  if (!value || typeof value === 'string') return '';
  return value.projectId || '';
}

function getHomepageImageAlt(value?: HomepageImageValue | null) {
  if (!value || typeof value === 'string') return '';
  return value.alt || '';
}

function getHomepageImageKey(value?: HomepageImageValue | null) {
  const url = getHomepageImageUrl(value);
  return url ? `${getHomepageImageProjectId(value)}:${url}` : '';
}

function getHomepageImageDedupKey(value?: HomepageImageValue | null) {
  const projectId = getHomepageImageProjectId(value);
  return projectId ? `project:${projectId}` : getHomepageImageKey(value);
}

function getProjectHrefById(projectId: string, projects: Project[], categoryMap: Map<string, Category>) {
  if (!projectId) return '';
  const project = projects.find((item) => item.id === projectId);
  return project ? getProjectPath(project, categoryMap) : '';
}

function getWrappedIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function getLoopedWindow<T>(items: T[], startIndex: number, size: number) {
  if (!items.length) return [];

  return Array.from({ length: Math.min(size, items.length) }, (_, offset) => {
    const index = getWrappedIndex(startIndex + offset, items.length);
    return { item: items[index], index };
  });
}

function getIndexFromPoint(clientX: number, clientY: number, selector: string) {
  const target = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>(selector);
  return getDataIndex(target);
}

function getIndexFromEventTarget(target: EventTarget | null, selector: string) {
  if (!(target instanceof Element)) return null;

  const element = target.closest<HTMLElement>(selector);
  return getDataIndex(element);
}

function getDataIndex(element?: HTMLElement | null) {
  const index = Number(element?.dataset.index ?? element?.dataset.projectIndex ?? element?.dataset.testimonialIndex);
  return Number.isInteger(index) ? index : null;
}

function getDragSteps(delta: number, itemSize: number) {
  const threshold = Math.max(30, itemSize * 0.28);
  if (Math.abs(delta) < threshold) return 0;

  const stride = Math.max(54, itemSize * 0.62);
  const steps = Math.max(1, Math.round(Math.abs(delta) / stride));
  return delta < 0 ? steps : -steps;
}

export default function HomePage() {
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [activeDetailIndex, setActiveDetailIndex] = useState(0);
  const [activeTestimonialImageIndex, setActiveTestimonialImageIndex] = useState(0);
  const projectDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const projectIgnoreClickRef = useRef(false);
  const projectAutoPausedRef = useRef(false);
  const testimonialDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const testimonialIgnoreClickRef = useRef(false);
  const { site, categories, projects, testimonials, homepageSettings: rawHomepageSettings } = useAppStore();
  const homepageSettings = useMemo(() => normalizeHomepageSettings(rawHomepageSettings), [rawHomepageSettings]);
  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const publishedProjects = useMemo(
    () => sortProjectsForPortfolio(projects.filter((project) => project.isPublished && !project.deletedAt)),
    [projects],
  );
  const selectedProjects = publishedProjects.slice(0, homepageSettings.showcase.projectCount);

  const projectImages = selectedProjects.map(getProjectCover).filter(Boolean);
  const images = Array.from(new Set([...projectImages, ...fallbackImages])).slice(0, 14);
  const heroImage = homepageSettings.hero.image || alexandra.onsite;
  const featureImage = homepageSettings.feature.image || alexandra.portrait;
  const featuredProjectIds = new Set(selectedProjects.filter((project) => project.isFeatured).map((project) => project.id));
  const showcaseProjects = [
    ...selectedProjects.filter((project) => project.isFeatured),
    ...selectedProjects.filter((project) => !featuredProjectIds.has(project.id)),
  ].slice(0, 8);
  const activeProject = showcaseProjects[activeProjectIndex] || showcaseProjects[0];
  const activeProjectCover = activeProject
    ? getProjectCover(activeProject) || images[activeProjectIndex] || heroImage
    : heroImage;
  const activeProjectHref = activeProject ? getProjectPath(activeProject, categoryMap) : null;
  const detailProjectImages = publishedProjects
    .map(getProjectImageRef)
    .filter((item): item is HomepageImageValue => Boolean(item))
    .slice(0, 14);
  const detailImages = [...detailProjectImages, ...(homepageSettings.detail.images || []), ...images, ...fallbackImages]
    .filter((item, index, source) => {
      const key = getHomepageImageDedupKey(item);
      return key && source.findIndex((next) => getHomepageImageDedupKey(next) === key) === index;
    })
    .slice(0, 12);
  const activeDetailImage = detailImages[activeDetailIndex] || detailImages[0] || heroImage;
  const testimonialItems = testimonials.filter((testimonial) => testimonial.isPublished !== false);
  const visibleTestimonials = testimonialItems.slice(0, homepageSettings.testimonials.count);
  const activeTestimonial = visibleTestimonials[activeTestimonialIndex] || visibleTestimonials[0];
  const activeProjectLink = activeTestimonial
    ? resolveTestimonialProject(activeTestimonial, publishedProjects, categoryMap)
    : null;
  const activeProjectImages = activeProjectLink?.project
    ? getProjectImages(activeProjectLink.project).filter(Boolean)
    : [];
  const activeVisualIndex = activeProjectImages.length ? getWrappedIndex(activeTestimonialImageIndex, activeProjectImages.length) : 0;
  const activeVisual = activeProjectImages[activeVisualIndex] || activeTestimonial?.image || alexandra.portrait;
  const projectRailItems = getLoopedWindow(showcaseProjects, activeProjectIndex - 2, 5);
  const detailThumbItems = getLoopedWindow(detailImages, activeDetailIndex - 2, 5);
  const testimonialRailItems = getLoopedWindow(visibleTestimonials, activeTestimonialIndex - 2, 5);
  const approachItems = homepageSettings.approach.items.slice(0, 3);
  const collageImages = homepageSettings.collage.images;

  const showPrevProject = () => {
    if (!showcaseProjects.length) return;
    setActiveProjectIndex((index) => getWrappedIndex(index - 1, showcaseProjects.length));
  };

  const showNextProject = () => {
    if (!showcaseProjects.length) return;
    setActiveProjectIndex((index) => getWrappedIndex(index + 1, showcaseProjects.length));
  };

  const showPrevTestimonial = () => {
    if (!visibleTestimonials.length) return;
    setActiveTestimonialIndex((index) => getWrappedIndex(index - 1, visibleTestimonials.length));
  };

  const showNextTestimonial = () => {
    if (!visibleTestimonials.length) return;
    setActiveTestimonialIndex((index) => getWrappedIndex(index + 1, visibleTestimonials.length));
  };

  const showPrevTestimonialImage = () => {
    if (activeProjectImages.length < 2) return;
    setActiveTestimonialImageIndex((index) => getWrappedIndex(index - 1, activeProjectImages.length));
  };

  const showNextTestimonialImage = () => {
    if (activeProjectImages.length < 2) return;
    setActiveTestimonialImageIndex((index) => getWrappedIndex(index + 1, activeProjectImages.length));
  };

  const handleProjectPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (showcaseProjects.length < 2) return;
    projectDragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleProjectPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = projectDragStartRef.current;
    projectDragStartRef.current = null;
    if (!start || showcaseProjects.length < 2) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const didDrag = Math.hypot(deltaX, deltaY) > 12;
    if (!didDrag) return;

    const targetIndex =
      getIndexFromEventTarget(event.target, '[data-project-index]') ??
      getIndexFromPoint(event.clientX, event.clientY, '[data-project-index]');

    if (targetIndex !== null) {
      projectIgnoreClickRef.current = true;
      window.setTimeout(() => {
        projectIgnoreClickRef.current = false;
      }, 0);
      setActiveProjectIndex(getWrappedIndex(targetIndex, showcaseProjects.length));
      return;
    }

    const railRect = event.currentTarget.getBoundingClientRect();
    const isHorizontal = window.matchMedia('(max-width: 900px)').matches;
    const primaryDelta = isHorizontal ? deltaX : Math.abs(deltaY) > Math.abs(deltaX) ? deltaY : deltaX;
    const itemSize = (isHorizontal ? railRect.width : railRect.height) / Math.min(5, showcaseProjects.length);
    const dragSteps = getDragSteps(primaryDelta, itemSize);
    if (!dragSteps) return;

    projectIgnoreClickRef.current = true;
    setActiveProjectIndex((index) => getWrappedIndex(index + dragSteps, showcaseProjects.length));
    window.setTimeout(() => {
      projectIgnoreClickRef.current = false;
    }, 0);
  };

  const handleProjectRailClick = (event: MouseEvent<HTMLDivElement>) => {
    if (projectIgnoreClickRef.current || showcaseProjects.length < 2) return;

    const targetIndex =
      getIndexFromEventTarget(event.target, '[data-project-index]') ??
      getIndexFromPoint(event.clientX, event.clientY, '[data-project-index]');
    if (targetIndex !== null) {
      setActiveProjectIndex(getWrappedIndex(targetIndex, showcaseProjects.length));
    }
  };

  const handleTestimonialPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (visibleTestimonials.length < 2) return;
    testimonialDragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleTestimonialPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = testimonialDragStartRef.current;
    testimonialDragStartRef.current = null;
    if (!start || visibleTestimonials.length < 2) return;

    const deltaX = event.clientX - start.x;
    const didDrag = Math.abs(deltaX) > 12;
    if (!didDrag) return;

    const targetIndex =
      getIndexFromEventTarget(event.target, '[data-testimonial-index]') ??
      getIndexFromPoint(event.clientX, event.clientY, '[data-testimonial-index]');

    if (targetIndex !== null) {
      testimonialIgnoreClickRef.current = true;
      window.setTimeout(() => {
        testimonialIgnoreClickRef.current = false;
      }, 0);
      setActiveTestimonialIndex(getWrappedIndex(targetIndex, visibleTestimonials.length));
      return;
    }

    const railRect = event.currentTarget.getBoundingClientRect();
    const dragSteps = getDragSteps(deltaX, railRect.width / Math.min(5, visibleTestimonials.length));
    if (!dragSteps) return;

    testimonialIgnoreClickRef.current = true;
    setActiveTestimonialIndex((index) => getWrappedIndex(index + dragSteps, visibleTestimonials.length));
    window.setTimeout(() => {
      testimonialIgnoreClickRef.current = false;
    }, 0);
  };

  const handleTestimonialRailClick = (event: MouseEvent<HTMLDivElement>) => {
    if (testimonialIgnoreClickRef.current || visibleTestimonials.length < 2) return;

    const targetIndex =
      getIndexFromEventTarget(event.target, '[data-testimonial-index]') ??
      getIndexFromPoint(event.clientX, event.clientY, '[data-testimonial-index]');
    if (targetIndex !== null) {
      setActiveTestimonialIndex(getWrappedIndex(targetIndex, visibleTestimonials.length));
    }
  };

  useEffect(() => {
    if (showcaseProjects.length < 2) return undefined;

    const timer = window.setInterval(() => {
      if (projectAutoPausedRef.current || projectDragStartRef.current) return;
      setActiveProjectIndex((index) => (index + 1) % showcaseProjects.length);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [showcaseProjects.length]);

  useEffect(() => {
    if (visibleTestimonials.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setActiveTestimonialIndex((index) => (index + 1) % visibleTestimonials.length);
    }, 15 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, [visibleTestimonials.length]);

  useEffect(() => {
    setActiveTestimonialImageIndex(0);
  }, [activeTestimonial?.id]);

  const projectLinkedImage = (
    value: HomepageImageValue | undefined,
    fallback: HomepageImageValue | string,
    className: string,
    fallbackUrl: string,
  ) => {
    const imageValue = getHomepageImageUrl(value) ? value : fallback;
    const imageUrl = getHomepageImageUrl(imageValue);
    const href = getProjectHrefById(getHomepageImageProjectId(imageValue), publishedProjects, categoryMap);
    const image = (
      <img
        src={getPreviewImageUrl(imageUrl)}
        alt={getHomepageImageAlt(imageValue)}
        onError={(event) => handlePreviewFallback(event, imageUrl || fallbackUrl)}
      />
    );

    return (
      <figure className={className}>
        {href ? <Link to={href} aria-label="Open related project">{image}</Link> : image}
      </figure>
    );
  };

  return (
    <>
      <Helmet>
        <title>{site?.name || 'Alexandra Diz'} - Interior Architecture</title>
        <meta
          name="description"
          content="Interior architecture and residential design by Alexandra Diz: calm homes, refined planning, kitchens, bathrooms and complete remodels."
        />
      </Helmet>

      <main className={styles.page}>
        <section className={styles.hero} data-home-hero="immersive">
          <img
            className={styles.heroImage}
            src={getPreviewImageUrl(heroImage)}
            alt="Alexandra Diz in a finished kitchen interior"
            onError={(event) => handlePreviewFallback(event, heroImage)}
          />
          <div className={styles.heroShade} />
          <div className={styles.heroText}>
            <h1>{homepageSettings.hero.title}</h1>
          </div>
        </section>

        <section className={styles.collage}>
          {projectLinkedImage(collageImages.primary, images[1] || heroImage, styles.collagePrimary, heroImage)}

          <article className={styles.collageCopy}>
            <h2>{homepageSettings.collage.title}</h2>
            <p>{homepageSettings.collage.text}</p>
          </article>

          {projectLinkedImage(collageImages.smallOne, images[4] || heroImage, styles.collageSmallOne, heroImage)}

          <blockquote className={styles.quote}>
            {homepageSettings.collage.quote}
          </blockquote>

          {projectLinkedImage(collageImages.wide, images[2] || heroImage, styles.collageWide, heroImage)}

          <article className={styles.floatCard}>
            <h3>{homepageSettings.collage.cardTitle}</h3>
            <p>{homepageSettings.collage.cardText}</p>
          </article>

          {projectLinkedImage(collageImages.tall, images[3] || heroImage, styles.collageTall, heroImage)}

          {projectLinkedImage(collageImages.smallTwo, images[5] || heroImage, styles.collageSmallTwo, heroImage)}
        </section>

        <section className={styles.feature}>
          <div className={styles.featureInner}>
            <blockquote className={styles.featureQuote}>
              {homepageSettings.feature.quote}
            </blockquote>
            <img
              className={styles.featureImage}
              src={getPreviewImageUrl(featureImage)}
              alt="Alexandra Diz in a home interior"
              onError={(event) => handlePreviewFallback(event, featureImage)}
            />
            <article className={styles.darkCard}>
              <h3>{homepageSettings.feature.darkTitle}</h3>
              <p>{homepageSettings.feature.darkText}</p>
              <Link to={homepageSettings.feature.linkHref || '/about'}>{homepageSettings.feature.linkLabel}</Link>
            </article>
            <article className={styles.whiteCard}>
              <h3>{homepageSettings.feature.lightTitle}</h3>
              <p>{homepageSettings.feature.lightText}</p>
            </article>
          </div>
        </section>

        <section className={styles.showcase}>
          <div className={styles.showcaseStage}>
            <div className={styles.showcaseCopy}>
              <p>{homepageSettings.showcase.label}</p>
              <h2>{homepageSettings.showcase.title}</h2>
            </div>

            <div
              className={styles.projectRail}
              aria-label="Home project carousel"
              onMouseEnter={() => {
                projectAutoPausedRef.current = true;
              }}
              onMouseLeave={() => {
                projectAutoPausedRef.current = false;
              }}
              onPointerDown={handleProjectPointerDown}
              onPointerUp={handleProjectPointerUp}
              onClick={handleProjectRailClick}
              onPointerCancel={() => {
                projectDragStartRef.current = null;
              }}
            >
              {projectRailItems.map(({ item: project, index }, windowIndex) => (
                <button
                  key={`${project.id}-${index}`}
                  type="button"
                  data-project-index={index}
                  data-position={windowIndex}
                  data-edge={projectRailItems.length >= 5 && (windowIndex === 0 || windowIndex === 4) ? 'true' : undefined}
                  className={index === activeProjectIndex ? styles.projectRailActive : undefined}
                  onClick={() => {
                    if (projectIgnoreClickRef.current) return;
                    setActiveProjectIndex(index);
                  }}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{getShortProjectTitle(project.title)}</strong>
                </button>
              ))}
            </div>

            <div
              className={styles.projectViewport}
              aria-live="polite"
              onMouseEnter={() => {
                projectAutoPausedRef.current = true;
              }}
              onMouseLeave={() => {
                projectAutoPausedRef.current = false;
              }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeProject?.id || activeProjectCover}
                  src={getPreviewImageUrl(activeProjectCover)}
                  alt={activeProject?.title || ''}
                  onError={(event) => handlePreviewFallback(event, activeProjectCover)}
                  initial={{ opacity: 0, scale: 1.06, clipPath: 'inset(12% 12% 12% 12%)' }}
                  animate={{ opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
                  exit={{ opacity: 0, scale: 0.98, clipPath: 'inset(16% 0% 16% 0%)' }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                />
              </AnimatePresence>
              <motion.div
                key={activeProject?.title || 'project-title'}
                className={styles.projectCaption}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <span>{String(activeProjectIndex + 1).padStart(2, '0')}</span>
                {activeProjectHref ? (
                  <Link
                    className={styles.projectCaptionTitle}
                    to={activeProjectHref}
                    aria-label={`Open ${activeProject?.title || 'project'}`}
                  >
                    <strong>{activeProject ? getShortProjectTitle(activeProject.title) : 'Projects'}</strong>
                  </Link>
                ) : (
                  <strong>{activeProject ? getShortProjectTitle(activeProject.title) : 'Projects'}</strong>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        <section className={styles.approach}>
          <div className={styles.approachCanvas}>
            <div className={styles.approachText}>
              <p>{homepageSettings.approach.label}</p>
              <h2>{homepageSettings.approach.title}</h2>
            </div>
            <figure className={styles.approachImage}>
              {(() => {
                const imageValue = getHomepageImageUrl(homepageSettings.approach.image) ? homepageSettings.approach.image : images[6] || heroImage;
                const imageUrl = getHomepageImageUrl(imageValue);
                const href = getProjectHrefById(getHomepageImageProjectId(imageValue), publishedProjects, categoryMap);
                const image = (
                  <img
                    src={getPreviewImageUrl(imageUrl)}
                    alt={getHomepageImageAlt(imageValue)}
                    onError={(event) => handlePreviewFallback(event, imageUrl || heroImage)}
                  />
                );
                return href ? <Link to={href} aria-label="Open related project">{image}</Link> : image;
              })()}
            </figure>
            <div className={styles.approachList}>
              {approachItems.map((item) => (
                <article key={`${item.number}-${item.title}`}>
                  <span>{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.detailGallery} aria-label="Interior details">
          <div className={styles.detailDeck}>
            <article className={styles.detailText}>
              <p>{homepageSettings.detail.label}</p>
              <h2>{homepageSettings.detail.title}</h2>
            </article>

            <div className={styles.detailViewport}>
              <AnimatePresence mode="wait">
                {(() => {
                  const imageUrl = getHomepageImageUrl(activeDetailImage);
                  const href = getProjectHrefById(getHomepageImageProjectId(activeDetailImage), publishedProjects, categoryMap);
                  const image = (
                    <motion.img
                      key={getHomepageImageKey(activeDetailImage)}
                      src={getPreviewImageUrl(imageUrl)}
                      alt={getHomepageImageAlt(activeDetailImage)}
                      onError={(event) => handlePreviewFallback(event, imageUrl || heroImage)}
                      initial={{ opacity: 0, x: 54, rotate: 1.4, scale: 1.03 }}
                      animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -44, rotate: -1.2, scale: 0.98 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  );
                  return href ? <Link key={`link-${getHomepageImageKey(activeDetailImage)}`} to={href} aria-label="Open related project">{image}</Link> : image;
                })()}
              </AnimatePresence>
            </div>

            <div className={styles.detailThumbs} aria-label="Interior detail images">
              {detailThumbItems.map(({ item: image, index }, windowIndex) => (
                <button
                  key={`${getHomepageImageKey(image)}-${index}`}
                  type="button"
                  data-position={windowIndex}
                  data-edge={detailThumbItems.length >= 5 && (windowIndex === 0 || windowIndex === 4) ? 'true' : undefined}
                  className={index === activeDetailIndex ? styles.detailThumbActive : undefined}
                  onClick={() => setActiveDetailIndex(index)}
                  aria-label={`Show detail ${index + 1}`}
                >
                  <img
                    src={getPreviewImageUrl(getHomepageImageUrl(image))}
                    alt=""
                    onError={(event) => handlePreviewFallback(event, getHomepageImageUrl(image) || heroImage)}
                  />
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.testimonials}>
          <div className={styles.testimonialShell}>
            <div className={styles.sectionIntro}>
              <p>{homepageSettings.testimonials.label}</p>
              <h2>{homepageSettings.testimonials.title}</h2>
            </div>

            {activeTestimonial ? (
              <div className={styles.testimonialSlider}>
                <article className={styles.testimonialActive}>
                  <div className={styles.testimonialHead}>
                    {activeTestimonial.image ? (
                      <img src={activeTestimonial.image} alt={activeTestimonial.author} />
                    ) : (
                      <span aria-hidden="true">{activeTestimonial.author.charAt(0)}</span>
                    )}
                    <div>
                      <strong>{activeTestimonial.author}</strong>
                      <small>{activeTestimonial.date}</small>
                    </div>
                  </div>
                  <p>{activeTestimonial.text}</p>
                  <div className={styles.testimonialLinks}>
                    {activeProjectLink ? (
                      activeProjectLink.external ? (
                        <a href={activeProjectLink.href} target="_blank" rel="noopener noreferrer">
                          {activeProjectLink.label}
                        </a>
                      ) : (
                        <Link to={activeProjectLink.href}>{activeProjectLink.label}</Link>
                      )
                    ) : null}
                    {activeTestimonial.linkHref ? (
                      <a
                        className={styles.sourceLink}
                        href={activeTestimonial.linkHref}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span aria-hidden="true">{getSourceLogo(activeTestimonial.link)}</span>
                        <b>{getSourceLabel(activeTestimonial.link)}</b>
                      </a>
                    ) : null}
                  </div>
                </article>

                <figure className={styles.testimonialVisual}>
                  {activeProjectLink && !activeProjectLink.external ? (
                    <Link className={styles.testimonialVisualLink} to={activeProjectLink.href} aria-label="Open reviewed project">
                      <img
                        key={activeVisual}
                        src={getPreviewImageUrl(activeVisual)}
                        alt=""
                        onError={(event) => handlePreviewFallback(event, activeVisual || alexandra.portrait)}
                      />
                    </Link>
                  ) : (
                    <img
                      key={activeVisual}
                      src={getPreviewImageUrl(activeVisual)}
                      alt=""
                      onError={(event) => handlePreviewFallback(event, activeVisual || alexandra.portrait)}
                    />
                  )}
                  {activeProjectImages.length > 1 ? (
                    <div className={styles.testimonialControls}>
                      <button type="button" onClick={showPrevTestimonialImage} aria-label="Previous project image">Prev</button>
                      <span>{String(activeVisualIndex + 1).padStart(2, '0')} / {String(activeProjectImages.length).padStart(2, '0')}</span>
                      <button type="button" onClick={showNextTestimonialImage} aria-label="Next project image">Next</button>
                    </div>
                  ) : null}
                </figure>
              </div>
            ) : null}

            <div
              className={styles.testimonialRail}
              onPointerDown={handleTestimonialPointerDown}
              onPointerUp={handleTestimonialPointerUp}
              onClick={handleTestimonialRailClick}
              onPointerCancel={() => {
                testimonialDragStartRef.current = null;
              }}
            >
              <div className={styles.testimonialTrack}>
                {testimonialRailItems.map(({ item: testimonial, index }) => (
                  <button
                    key={`${testimonial.author}-${testimonial.date}-${index}`}
                    type="button"
                    data-testimonial-index={index}
                    className={index === activeTestimonialIndex ? styles.testimonialRailActive : undefined}
                    onClick={() => {
                      if (testimonialIgnoreClickRef.current) return;
                      setActiveTestimonialIndex(index);
                    }}
                  >
                    <span>{testimonial.author}</span>
                    <small>{testimonial.date}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <p>{homepageSettings.cta.label}</p>
          <h2>{homepageSettings.cta.title}</h2>
          <Link to={homepageSettings.cta.buttonHref || '/contact'}>{homepageSettings.cta.buttonLabel}</Link>
        </section>
      </main>
    </>
  );
}
