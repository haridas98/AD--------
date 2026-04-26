import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { DraftTestimonial } from '../../content/homepageDraft';

type HomeTestimonialsProps = {
  data: {
    label: string;
    title: string;
    items: DraftTestimonial[];
  };
  styles: Record<string, string>;
};

export function HomeTestimonials({ data, styles }: HomeTestimonialsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (data.items.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % data.items.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [data.items.length]);

  const activeItem = data.items[activeIndex];

  return (
    <section className={styles.contentSection} data-home-testimonials>
      <div className="page-shell">
        <div className={`page-shell__portfolio ${styles.sectionStack}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>{data.label}</span>
            <h2 className={styles.sectionTitle}>{data.title}</h2>
          </div>

          <div className={styles.testimonialSlider}>
            <AnimatePresence mode="wait">
              <motion.article
                key={`${activeItem.name}-${activeIndex}`}
                className={styles.testimonialCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                {activeItem.image ? (
                  <img src={activeItem.image} alt={activeItem.name} className={styles.testimonialAvatar} />
                ) : null}
                <p>{activeItem.quote}</p>
                <div className={styles.testimonialMeta}>
                  <strong>{activeItem.name}</strong>
                  <span>{activeItem.role}</span>
                </div>
              </motion.article>
            </AnimatePresence>

            {data.items.length > 1 && (
              <div className={styles.testimonialDots}>
                {data.items.map((item, index) => (
                  <button
                    key={`${item.name}-${index}`}
                    type="button"
                    className={`${styles.testimonialDot}${index === activeIndex ? ` ${styles.testimonialDotActive}` : ''}`}
                    aria-label={`Show testimonial ${index + 1}`}
                    onClick={() => setActiveIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
