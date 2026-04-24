import React from 'react';
import { Link } from 'react-router-dom';
import type { DraftLink } from '../../content/homepageDraft';

type ProjectItem = {
  title: string;
  category: string;
  location?: string;
  year?: string;
  summary: string;
  href: string;
  image?: string;
  accent: string;
};

type HomeProjectsGatewayProps = {
  data: {
    label: string;
    title: string;
    text: string;
    cta: DraftLink;
  };
  items: ProjectItem[];
  styles: Record<string, string>;
};

function getVisualStyle(item: ProjectItem) {
  if (item.image) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(10, 10, 10, 0.02) 0%, rgba(10, 10, 10, 0.6) 100%), url(${item.image})`,
    };
  }

  return {
    backgroundImage: `linear-gradient(135deg, ${item.accent} 0%, rgba(22, 22, 22, 0.12) 100%)`,
  };
}

export function HomeProjectsGateway({ data, items, styles }: HomeProjectsGatewayProps) {
  const [lead, ...rest] = items;

  if (!lead) return null;

  return (
    <section className={styles.contentSection} data-home-projects>
      <div className="page-shell">
        <div className={`page-shell__portfolio ${styles.sectionStack}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>{data.label}</span>
            <h2 className={styles.sectionTitle}>{data.title}</h2>
            <p className={styles.sectionText}>{data.text}</p>
          </div>

          <div className={styles.projectsLayout}>
            <Link to={lead.href} className={styles.projectLeadCard}>
              <div className={styles.projectVisual} style={getVisualStyle(lead)} />
              <div className={styles.projectBody}>
                <span className={styles.projectEyebrow}>{lead.category}</span>
                <h3>{lead.title}</h3>
                <p>{lead.summary}</p>
                <div className={styles.projectMeta}>
                  <span>{lead.location}</span>
                  <span>{lead.year}</span>
                </div>
              </div>
            </Link>

            <div className={styles.projectGrid}>
              {rest.map((item) => (
                <Link key={item.title} to={item.href} className={styles.projectMiniCard}>
                  <div className={styles.projectMiniVisual} style={getVisualStyle(item)} />
                  <div className={styles.projectBody}>
                    <span className={styles.projectEyebrow}>{item.category}</span>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
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
