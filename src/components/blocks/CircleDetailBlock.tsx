import React, { useEffect, useRef, useState } from 'react';
import styles from './CircleDetailBlock.module.scss';
import { getCoverImageStyle, normalizeImageAsset } from '../../lib/imageTransforms';

type CircleItem = {
  image: string;
  alt?: string;
  label?: string;
  crop?: {
    scale?: number;
    x?: number;
    y?: number;
  };
};

interface CircleDetailBlockProps {
  data: {
    title?: string;
    description?: string;
    items?: Array<CircleItem>;
  };
}

export default function CircleDetailBlock({ data }: CircleDetailBlockProps) {
  const items = data.items || [];
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));
  const isSlider = items.length > 5;
  const useCarousel = isSlider || isMobile;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!useCarousel || items.length < 2) return undefined;
    const timerId = window.setInterval(() => {
      setActiveIndex((currentIndex) => {
        const nextIndex = (currentIndex + 1) % items.length;
        const nextNode = trackRef.current?.children[nextIndex] as HTMLElement | undefined;
        nextNode?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        return nextIndex;
      });
    }, 15000);

    return () => window.clearInterval(timerId);
  }, [items.length, useCarousel]);

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  if (!items.length) return null;

  function moveTo(nextIndex: number) {
    const normalized = (nextIndex + items.length) % items.length;
    const nextNode = trackRef.current?.children[normalized] as HTMLElement | undefined;
    nextNode?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    setActiveIndex(normalized);
  }

  return (
    <section className={styles.block} data-circle-detail data-project-block>
      {(data.title || data.description) ? (
        <div className={styles.head}>
          {data.title ? <h2>{data.title}</h2> : null}
          {data.description ? <p>{data.description}</p> : null}
        </div>
      ) : null}

      <div className={styles.carousel}>
        {useCarousel ? (
          <>
            <button
              type="button"
              className={`${styles.nav} ${styles.navPrev}`}
              aria-label="Previous details"
              onClick={() => moveTo(activeIndex - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.nav} ${styles.navNext}`}
              aria-label="Next details"
              onClick={() => moveTo(activeIndex + 1)}
            >
              ›
            </button>
          </>
        ) : null}

        <div ref={trackRef} className={`${styles.grid}${useCarousel ? ` ${styles.gridSlider}` : ''}`}>
          {items.map((item, index) => (
            <figure key={`${item.image}-${index}`} className={styles.item}>
              <div className={styles.media}>
                {(() => {
                  const image = normalizeImageAsset({ url: item.image, alt: item.alt, crop: item.crop });
                  if (!image) return null;
                  return <img src={image.url} alt={image.alt || item.label || ''} style={getCoverImageStyle(image.crop)} />;
                })()}
              </div>
              {item.label ? <figcaption>{item.label}</figcaption> : null}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
