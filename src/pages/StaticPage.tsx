import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export default function StaticPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const { getPage, site } = useAppStore();

  const page = getPage(pageId || '');

  if (!page) {
    return (
      <main className="container page-pad">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Page not found
        </motion.h1>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>{page.title} — {site?.name || 'Alexandra Diz'}</title>
        <meta name="description" content={page.body} />
      </Helmet>

      <motion.main
        className="container page-pad static-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>{page.title}</h1>
        <p>{page.body}</p>
      </motion.main>
    </>
  );
}
