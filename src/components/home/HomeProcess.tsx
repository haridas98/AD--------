import React from 'react';
import { motion } from 'framer-motion';
import type { DraftProcessStep } from '../../content/homepageDraft';

type HomeProcessProps = {
  data: {
    label: string;
    title: string;
    text: string;
    steps: DraftProcessStep[];
  };
  styles: Record<string, string>;
};

export function HomeProcess({ data, styles }: HomeProcessProps) {
  return (
    <section className={styles.contentSection} data-home-process>
      <div className="page-shell">
        <div className={`page-shell__portfolio ${styles.sectionStack}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>{data.label}</span>
            <h2 className={styles.sectionTitle}>{data.title}</h2>
            <p className={styles.sectionText}>{data.text}</p>
          </div>

          <div className={styles.processRail}>
            <div className={styles.processGrid}>
              {data.steps.map((step, index) => (
                <motion.article
                  key={step.step}
                  className={styles.processCard}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ delay: index * 0.08, duration: 0.45, ease: 'easeOut' }}
                >
                  <span className={styles.processStep}>{step.step}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
