import React from 'react';
import { motion } from 'framer-motion';

interface MetaInfoBlockProps {
  data: {
    items?: Array<{ label: string; value: string }>;
    metaText?: string;
  };
}

export default function MetaInfoBlock({ data }: MetaInfoBlockProps) {
  const items = data.items?.length
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
