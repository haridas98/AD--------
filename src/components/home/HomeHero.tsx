import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { DraftLink, DraftMetric } from '../../content/homepageDraft';

type HomeHeroProps = {
  data: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: DraftLink;
    secondaryCta: DraftLink;
    videoPoster: string;
    media: {
      kicker: string;
      title: string;
      caption: string;
    };
  };
  metrics: DraftMetric[];
  styles: Record<string, string>;
};

export function HomeHero({ data, metrics, styles }: HomeHeroProps) {
  return (
    <section className={styles.heroSection} data-home-hero>
      <div
        className={styles.heroBackdrop}
        style={{ backgroundImage: `linear-gradient(180deg, rgba(16, 14, 12, 0.28) 0%, rgba(16, 14, 12, 0.82) 100%), url(${data.videoPoster})` }}
      />
      <div className="page-shell page-shell--offset">
        <div className={`page-shell__portfolio ${styles.heroShell}`}>
          <motion.div
            className={styles.heroCopy}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <motion.span
              className={styles.sectionEyebrow}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.45 }}
            >
              {data.eyebrow}
            </motion.span>
            <motion.h1
              className={styles.heroTitle}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.5 }}
            >
              {data.title}
            </motion.h1>
            <motion.p
              className={styles.heroLead}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {data.description}
            </motion.p>
            <motion.div
              className={styles.heroActions}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.45 }}
            >
              <Link to={data.primaryCta.to} className={styles.primaryButton}>
                {data.primaryCta.label}
              </Link>
              <Link to={data.secondaryCta.to} className={styles.secondaryButton}>
                {data.secondaryCta.label}
              </Link>
            </motion.div>
            <motion.div
              className={styles.metricRow}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.45 }}
            >
              {metrics.map((metric) => (
                <div key={metric.label} className={styles.metricCard}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className={styles.heroMediaCard}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.55, ease: 'easeOut' }}
          >
            <span className={styles.mediaKicker}>{data.media.kicker}</span>
            <div
              className={styles.mediaFrame}
              style={{ backgroundImage: `linear-gradient(180deg, rgba(14, 10, 8, 0.2) 0%, rgba(14, 10, 8, 0.58) 100%), url(${data.videoPoster})` }}
            >
              <div className={styles.mediaGlow} />
              <div className={styles.mediaGlowAlt} />
              <div className={styles.mediaBadge}>Brand Film</div>
            </div>
            <div className={styles.mediaMeta}>
              <strong>{data.media.title}</strong>
              <p>{data.media.caption}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
