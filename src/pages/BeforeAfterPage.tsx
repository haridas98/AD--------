import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import Lightbox from '../components/Lightbox';
import BeforeAfterBlock from '../components/blocks/BeforeAfterBlock';
import { getCanonicalPortfolioProjectPathForCategory } from '../lib/portfolioRoutes';

export default function BeforeAfterPage() {
  const { categories, projects, site } = useAppStore();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  const beforeAfterItems = projects.flatMap((project) => {
    const content = typeof project.content === 'string' ? JSON.parse(project.content) : project.content;

    return content
      .filter((block: any) => block.type === 'beforeAfter')
      .map((block: any) => ({
        projectId: project.id,
        projectTitle: project.title,
        projectSlug: project.slug,
        categoryId: project.categoryId,
        ...block.data,
      }));
  });

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Before & After - {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content="Before and after transformations of our interior design projects" />
      </Helmet>

      <main className="page-shell page-shell--offset before-after-page">
        <div className="page-shell__portfolio">
          <motion.header
            className="page-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-white">Before & After</h1>
            <p className="text-muted">Transformation stories from our projects</p>
          </motion.header>

          <div className="before-after-list">
            {beforeAfterItems.map((item, index) => (
              <motion.article
                key={`${item.projectId}-${index}`}
                className="before-after-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="before-after-info">
                  <Link to={getCanonicalPortfolioProjectPathForCategory(categoryMap.get(item.categoryId), item.projectSlug)}>
                    <h3>{item.projectTitle}</h3>
                  </Link>
                  {item.title && <p>{item.title}</p>}
                </div>

                <BeforeAfterBlock
                  data={{
                    beforeImage: item.beforeImage,
                    afterImage: item.afterImage,
                    beforeAlt: `${item.projectTitle} before`,
                    afterAlt: `${item.projectTitle} after`,
                  }}
                  variant="embedded"
                  className="before-after-item__block"
                  onOpenLightbox={openLightbox}
                />
              </motion.article>
            ))}
          </div>

          {beforeAfterItems.length === 0 && (
            <p className="text-muted before-after-empty">
              No before/after transformations available yet.
            </p>
          )}
        </div>
      </main>

      {lightboxOpen && (
        <Lightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
