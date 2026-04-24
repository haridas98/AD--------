import React from 'react';
import { Link } from 'react-router-dom';
import type { DraftLink } from '../../content/homepageDraft';

type BlogItem = {
  title: string;
  excerpt: string;
  href: string;
  tag: string;
  coverImage?: string;
  dateLabel?: string;
};

type HomeBlogPreviewProps = {
  data: {
    label: string;
    title: string;
    text: string;
    cta: DraftLink;
  };
  items: BlogItem[];
  styles: Record<string, string>;
};

export function HomeBlogPreview({ data, items, styles }: HomeBlogPreviewProps) {
  return (
    <section className={styles.contentSection} data-home-blog>
      <div className="page-shell">
        <div className={`page-shell__portfolio ${styles.sectionStack}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>{data.label}</span>
            <h2 className={styles.sectionTitle}>{data.title}</h2>
            <p className={styles.sectionText}>{data.text}</p>
          </div>

          <div className={styles.blogGrid}>
            {items.map((item) => (
              <Link key={item.title} to={item.href} className={styles.blogCard}>
                <div
                  className={styles.blogVisual}
                  style={{
                    backgroundImage: item.coverImage
                      ? `linear-gradient(180deg, rgba(10, 10, 10, 0.04) 0%, rgba(10, 10, 10, 0.55) 100%), url(${item.coverImage})`
                      : 'linear-gradient(135deg, rgba(219, 199, 174, 0.92) 0%, rgba(39, 34, 30, 0.18) 100%)',
                  }}
                />
                <div className={styles.blogBody}>
                  <div className={styles.blogMeta}>
                    <span>{item.tag}</span>
                    <span>{item.dateLabel}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className={styles.sectionFooter}>
            <Link to={data.cta.to} className={styles.secondaryButton}>
              {data.cta.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
