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
      className="project-meta"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex',
        gap: '40px',
        padding: '20px 0',
        margin: '0 15px',
        maxWidth: 'var(--content-max-width)',
        marginInline: 'auto',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {data.items.map((item, i) => (
        <p key={i} style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
            {item.label}:
          </strong>{' '}
          {item.value}
        </p>
      ))}
    </motion.section>
  );
}
