import React, { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { PortfolioProjectCard } from '../components/PortfolioProjectCard';
import { getCanonicalPortfolioProjectPathForCategory, portfolioSectionMap } from '../lib/portfolioRoutes';
import { collectProjectImages, parseProjectContent } from '../lib/projectBlockTemplates';
import { getProjectDisplayYear, sortProjectsForPortfolio } from '../lib/projectOrdering';
import { absoluteUrl, breadcrumbSchema, faqSchema, serviceSchema } from '../lib/seo';
import { getServiceLandingPage } from '../lib/seoLandingData';
import { useAppStore } from '../store/useAppStore';
import styles from './CategoryPage.module.scss';

function getCover(project: any) {
  return project.coverImage
    || (project.assets || []).find((asset: any) => asset.kind === 'image' && asset.status === 'active' && asset.publicUrl)?.publicUrl
    || collectProjectImages(parseProjectContent(project.content))[0]
    || '';
}

export default function ServiceLandingPage() {
  const { serviceKey = '' } = useParams<{ serviceKey: string }>();
  const { categories, projects, site } = useAppStore();
  const service = getServiceLandingPage(serviceKey);

  const section = service ? portfolioSectionMap[service.categoryKey] : null;
  const category = section ? categories.find((item) => item.slug === section.legacySlug || item.id === section.legacySlug) : null;

  const relatedProjects = useMemo(() => {
    if (!category) return [];
    return sortProjectsForPortfolio(projects.filter((project) => (
      project.categoryId === category.id &&
      project.isPublished &&
      !project.deletedAt &&
      getCover(project)
    ))).slice(0, 8);
  }, [category?.id, projects]);

  if (!service || !category) return <Navigate to="/services" replace />;

  return (
    <>
      <Helmet>
        <title>{service.title} | {site?.name || 'Alexandra Diz Architecture'}</title>
        <meta name="description" content={service.description} />
        <meta name="keywords" content={service.keywords.join(', ')} />
        <link rel="canonical" href={absoluteUrl(service.path)} />
        <meta property="og:title" content={`${service.title} | Alexandra Diz Architecture`} />
        <meta property="og:description" content={service.description} />
        <meta property="og:url" content={absoluteUrl(service.path)} />
        <script type="application/ld+json">
          {JSON.stringify([
            serviceSchema(service.title, service.description, service.path),
            breadcrumbSchema([
              { name: 'Home', url: '/' },
              { name: 'Services', url: '/services' },
              { name: service.eyebrow, url: service.path },
            ]),
            faqSchema(service.faq),
          ])}
        </script>
      </Helmet>
      <main className={`${styles.page} page-shell page-shell--offset`}>
        <div className="page-shell__portfolio">
          <motion.header className={styles.header} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p>{service.eyebrow}</p>
            <h1>{service.title}</h1>
            <p>{service.description}</p>
          </motion.header>
          <div className={styles.grid}>
            {relatedProjects.map((project) => (
              <PortfolioProjectCard
                key={project.id}
                to={getCanonicalPortfolioProjectPathForCategory(category, project.slug)}
                title={project.title}
                image={getCover(project)}
                eyebrow={category.name}
                cityName={project.cityName}
                year={getProjectDisplayYear(project)}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
