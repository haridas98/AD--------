import React from 'react';
import { Link } from 'react-router-dom';
import type { DraftLink } from '../../content/homepageDraft';

type HomeFinalCtaProps = {
  data: {
    label: string;
    title: string;
    text: string;
    primaryCta: DraftLink;
    secondaryCta: DraftLink;
    aside: string;
  };
  styles: Record<string, string>;
};

export function HomeFinalCta({ data, styles }: HomeFinalCtaProps) {
  return (
    <section className={styles.finalSection} data-home-cta>
      <div className="page-shell">
        <div className={`page-shell__portfolio ${styles.finalCard}`}>
          <div className={styles.finalCopy}>
            <span className={styles.sectionLabel}>{data.label}</span>
            <h2 className={styles.sectionTitle}>{data.title}</h2>
            <p className={styles.sectionText}>{data.text}</p>
          </div>

          <div className={styles.finalActions}>
            <Link to={data.primaryCta.to} className={styles.primaryButton}>
              {data.primaryCta.label}
            </Link>
            <Link to={data.secondaryCta.to} className={styles.secondaryButton}>
              {data.secondaryCta.label}
            </Link>
            <p className={styles.finalAside}>{data.aside}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
