import React from 'react';
import type { DraftHighlight, DraftMetric } from '../../content/homepageDraft';

type HomeIntroProps = {
  data: {
    label: string;
    title: string;
    text: string;
    portraitPrimary: string;
    materialImages: string[];
    quote: string;
    highlights: DraftHighlight[];
  };
  metrics: DraftMetric[];
  styles: Record<string, string>;
};

export function HomeIntro({ data, metrics, styles }: HomeIntroProps) {
  return (
    <section className={styles.contentSection} data-home-intro>
      <div className="page-shell">
        <div className={`page-shell__portfolio ${styles.sectionStack}`}>
          <div className={styles.aboutFounderGrid}>
            <div className={styles.founderPortraitWrap}>
              <span className={styles.sectionLabel}>About the Founder</span>
              <img
                src={data.portraitPrimary}
                alt="Alexandra Diz in an interior project"
                className={styles.introPortraitPrimary}
              />
            </div>

            <div className={styles.founderBio}>
              <span className={styles.sectionLabel}>{data.label}</span>
              <h2 className={styles.sectionTitle}>{data.title}</h2>
              <p className={styles.sectionText}>{data.text}</p>

              <div className={styles.introHighlights}>
                {data.highlights.map((item) => (
                  <article key={item.title} className={styles.detailCard}>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>

              <div className={styles.signatureBlock}>
                <span>Sign-off</span>
                <strong>Alexandra Diz</strong>
              </div>
            </div>
          </div>

          <div className={styles.directQuote}>
            <span className={styles.sectionLabel}>Direct Quote</span>
            <p>&ldquo;{data.quote}&rdquo;</p>
            <strong>- Alexandra Diz</strong>
          </div>

          <div className={styles.materialStrip}>
            {data.materialImages.map((image, index) => (
              <div key={`${image}-${index}`} className={styles.materialCard}>
                <img src={image} alt="" />
                <span>{['Hand-selected Materials', 'Natural Textures', 'Timeless Finishes'][index]}</span>
              </div>
            ))}
          </div>

          <div className={styles.metricStrip}>
            {metrics.map((metric) => (
              <div key={metric.label} className={styles.metricStripItem}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
