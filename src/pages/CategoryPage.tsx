import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, projects, site } = useAppStore();

  const category = categories.find((c) => c.slug === slug);
  const categoryProjects = projects.filter(
    (p) => p.categoryId === category?.id && p.isPublished
  );

  if (!category) {
    return (
      <main className="container page-pad">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Section not found
        </motion.h1>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>{category.name} — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={`${category.name} projects by Alexandra Diz`} />
      </Helmet>

      <main className="container page-pad">
        <motion.header
          className="page-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>{category.name}</h1>
          {category.description && <p>{category.description}</p>}
        </motion.header>

        <div className="cards-grid">
          {categoryProjects.map((project, index) => {
            const content = typeof project.content === 'string' ? JSON.parse(project.content) : project.content;
            const heroBlock = content.find((b: any) => b.type === 'heroImage');
            const coverImage = heroBlock?.data?.image || '';

            return (
              <motion.article
                key={project.id}
                className="project-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Link to={`/project/${project.slug}`} className="project-image-wrap">
                  {coverImage && (
                    <img src={coverImage} alt={project.title} loading="lazy" />
                  )}
                </Link>
                <div className="project-body">
                  <h3>{project.title}</h3>
                </div>
              </motion.article>
            );
          })}
        </div>
      </main>
    </>
  );
}
