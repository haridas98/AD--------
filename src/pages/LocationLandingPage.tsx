import React, { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { PortfolioProjectCard } from '../components/PortfolioProjectCard';
import { getCanonicalPortfolioProjectPathForCategory } from '../lib/portfolioRoutes';
import { collectProjectImages, parseProjectContent } from '../lib/projectBlockTemplates';
import { getProjectDisplayYear, sortProjectsForPortfolio } from '../lib/projectOrdering';
import { absoluteUrl, breadcrumbSchema, serviceSchema } from '../lib/seo';
import { formatCityWithState, slugifyLocation } from '../lib/seoLandingData';
import { useAppStore } from '../store/useAppStore';
import styles from './CategoryPage.module.scss';

function getCover(project: any) {
  return project.coverImage
    || (project.assets || []).find((asset: any) => asset.kind === 'image' && asset.status === 'active' && asset.publicUrl)?.publicUrl
    || collectProjectImages(parseProjectContent(project.content))[0]
    || '';
}

export default function LocationLandingPage() {
  const { citySlug = '' } = useParams<{ citySlug: string }>();
  const { categories, projects, site } = useAppStore();
  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  const cityName = useMemo(() => {
    const match = projects.find((project) => project.cityName && slugifyLocation(project.cityName) === citySlug);
    return match?.cityName || '';
  }, [citySlug, projects]);

  const locationProjects = useMemo(() => (
    sortProjectsForPortfolio(projects.filter((project) => (
      project.isPublished &&
      !project.deletedAt &&
      project.cityName &&
      slugifyLocation(project.cityName) === citySlug &&
      getCover(project)
    )))
  ), [citySlug, projects]);

  if (!cityName || !locationProjects.length) return <Navigate to="/projects" replace />;

  const displayCity = formatCityWithState(cityName);
  const canonicalPath = `/locations/${citySlug}`;
  const description = `Interior design projects by Alexandra Diz in ${displayCity}: kitchens, bathrooms, remodels, ADUs, and finished home photos.`;

  return (
    <>
      <Helmet>
        <title>Interior Designer in {displayCity} | Alexandra Diz Architecture</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={`interior designer ${displayCity}, kitchen remodel ${displayCity}, bathroom remodel ${displayCity}, Alexandra Diz`} />
        <link rel="canonical" href={absoluteUrl(canonicalPath)} />
        <meta property="og:title" content={`Interior Designer in ${displayCity} | Alexandra Diz Architecture`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={absoluteUrl(canonicalPath)} />
        <script type="application/ld+json">
          {JSON.stringify([
            serviceSchema(`Interior Design in ${displayCity}`, description, canonicalPath, displayCity),
            breadcrumbSchema([
              { name: 'Home', url: '/' },
              { name: 'Projects', url: '/projects' },
              { name: displayCity, url: canonicalPath },
            ]),
          ])}
        </script>
      </Helmet>
      <main className={`${styles.page} page-shell page-shell--offset`}>
        <div className="page-shell__portfolio">
          <motion.header className={styles.header} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p>Location</p>
            <h1>Interior Designer in {displayCity}</h1>
            <p>{description}</p>
          </motion.header>
          <div className={styles.grid}>
            {locationProjects.map((project) => {
              const category = categoryMap.get(project.categoryId);
              return (
                <PortfolioProjectCard
                  key={project.id}
                  to={getCanonicalPortfolioProjectPathForCategory(category, project.slug)}
                  title={project.title}
                  image={getCover(project)}
                  eyebrow={category?.name || 'Project'}
                  cityName={project.cityName}
                  year={getProjectDisplayYear(project)}
                />
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
