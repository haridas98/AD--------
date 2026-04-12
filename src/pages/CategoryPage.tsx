import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import ProjectGrid from '../components/ProjectGrid';
import { useAppStore } from '../store/useAppStore';

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { getCategoryById, getProjectsByCategory } = useAppStore();

  const category = getCategoryById(categoryId || '');
  const projects = getProjectsByCategory(categoryId || '');

  if (!category) {
    return (
      <main className="container page-pad">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Section not found
        </motion.h1>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>{category.name} — Alexandra Diz</title>
        <meta
          name="description"
          content={`Selected projects in the ${category.name.toLowerCase()} direction.`}
        />
      </Helmet>

      <main className="container page-pad">
        <motion.header
          className="page-title reveal"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>{category.name}</h1>
          <p>
            Selected projects in the {category.name.toLowerCase()} direction.
          </p>
        </motion.header>

        <ProjectGrid projects={projects} />
      </main>
    </>
  );
}
