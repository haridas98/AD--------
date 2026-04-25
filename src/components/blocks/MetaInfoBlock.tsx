import React from 'react';
import { motion } from 'framer-motion';
import type { BlockRenderContext } from '.';

interface MetaInfoBlockProps {
  data: {
    items?: Array<{ label: string; value: string }>;
    metaText?: string;
  };
  context?: BlockRenderContext;
}

export default function MetaInfoBlock({ data, context }: MetaInfoBlockProps) {
  const project = context?.project;
  const projectItems = project
    ? [
        project.categoryName ? { label: 'Category', value: project.categoryName } : null,
        project.cityName ? { label: 'Location', value: project.cityName } : null,
        project.year ? { label: 'Year', value: String(project.year) } : null,
      ].filter(Boolean) as Array<{ label: string; value: string }>
    : [];

  const items = projectItems.length
    ? projectItems
    : data.items?.length
    ? data.items
    : String(data.metaText || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [label, ...rest] = line.split(':');
          return { label: (label || '').trim(), value: rest.join(':').trim() };
        })
        .filter((item) => item.label && item.value);

  if (!items.length) return null;

  return (
    <motion.section
      className="container block-meta-info"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      {items.map((item, i) => (
        <p key={i} className="block-meta-info-item">
          <strong>{item.label}:</strong> {item.value}
        </p>
      ))}
    </motion.section>
  );
}
