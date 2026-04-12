import React from 'react';
import { motion } from 'framer-motion';

interface MetaInfoBlockProps {
  data: {
    items: Array<{ label: string; value: string }>;
  };
}

export default function MetaInfoBlock({ data }: MetaInfoBlockProps) {
  if (!data.items?.length) return null;

  return (
    <motion.section
      className="block-meta-info"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      {data.items.map((item, i) => (
        <p key={i} className="block-meta-info-item">
          <strong>{item.label}:</strong> {item.value}
        </p>
      ))}
    </motion.section>
  );
}
