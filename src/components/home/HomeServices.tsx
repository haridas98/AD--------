import React from 'react';
import type { CSSProperties } from 'react';
import type { DraftService } from '../../content/homepageDraft';

type HomeServicesProps = {
  data: {
    label: string;
    title: string;
    text: string;
    items: DraftService[];
  };
  styles: Record<string, string>;
};

export function HomeServices({ data, styles }: HomeServicesProps) {
  return (
    <section className={styles.contentSection} data-home-services>
      <div className="page-shell">
        <div className={`page-shell__portfolio ${styles.sectionStack}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>{data.label}</span>
            <h2 className={styles.sectionTitle}>{data.title}</h2>
            <p className={styles.sectionText}>{data.text}</p>
          </div>

          <div className={styles.serviceGrid}>
            {data.items.map((item) => (
              <article
                key={item.id}
                className={styles.serviceCard}
                style={{ '--service-accent': item.accent } as CSSProperties}
              >
                <span className={styles.serviceIndex}>{item.id}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <ul className={styles.serviceList}>
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
