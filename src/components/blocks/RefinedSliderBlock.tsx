import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './RefinedSliderBlock.module.scss';
import { normalizeImageAsset } from '../../lib/imageTransforms';

type SliderImage = {
  url: string;
  alt?: string;
};

interface RefinedSliderBlockProps {
  data: {
    title?: string;
    description?: string;
    images?: Array<string | SliderImage>;
    thumbnailPosition?: 'left' | 'right' | 'bottom';
  };
}

function normalizeImages(images: Array<string | SliderImage> = []): SliderImage[] {
  return images
    .map((image) => normalizeImageAsset(image))
    .filter((image) => image?.url);
}

export default function RefinedSliderBlock({ data }: RefinedSliderBlockProps) {
  const shouldReduceMotion = useReducedMotion();
  const images = useMemo(() => normalizeImages(data.images), [data.images]);
  const [index, setIndex] = useState(0);
  const [orientationMap, setOrientationMap] = useState<Record<string, 'portrait' | 'landscape'>>({});
  const thumbPosition = data.thumbnailPosition || 'bottom';

  useEffect(() => {
    if (images.length < 2) return;
    const timerId = window.setInterval(() => {
      setIndex((value) => (value + 1) % images.length);
    }, 15000);

    return () => window.clearInterval(timerId);
  }, [images.length]);

  useEffect(() => {
    if (index >= images.length) setIndex(0);
  }, [images.length, index]);

  if (!images.length) return null;

  const active = images[index];
  const activeOrientation = orientationMap[active.url] || 'landscape';

  return (
    <section className={styles.block} data-project-block>
      {(data.title || data.description) ? (
        <div className={styles.head}>
          {data.title ? <h2>{data.title}</h2> : null}
          {data.description ? <p>{data.description}</p> : null}
        </div>
      ) : null}

      <div className={`${styles.layout} ${styles[`layout--${thumbPosition}`]}`}>
        <div className={`${styles.stage} ${activeOrientation === 'portrait' ? styles.stagePortrait : styles.stageLandscape}`}>
          {images.length > 1 ? (
            <>
              <button
                type="button"
                className={styles.hitLeft}
                aria-label="Previous image"
                onClick={() => setIndex((value) => (value - 1 + images.length) % images.length)}
              />
              <button
                type="button"
                className={styles.hitRight}
                aria-label="Next image"
                onClick={() => setIndex((value) => (value + 1) % images.length)}
              />
            </>
          ) : null}

          <motion.img
            key={active.url}
            src={active.url}
            alt={active.alt || data.title || ''}
            className={`${styles.image} ${activeOrientation === 'portrait' ? styles.imagePortrait : styles.imageLandscape}`}
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              setOrientationMap((prev) => ({
                ...prev,
                [active.url]: naturalHeight > naturalWidth ? 'portrait' : 'landscape',
              }));
            }}
            initial={shouldReduceMotion ? false : { opacity: 0.4, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </div>

        {images.length > 1 ? (
          <div className={styles.thumbs}>
            {images.map((image, imageIndex) => (
              <button
                key={`${image.url}-${imageIndex}`}
                type="button"
                data-slider-thumb
                className={`${styles.thumb}${imageIndex === index ? ` ${styles.thumbActive}` : ''}`}
                onClick={() => setIndex(imageIndex)}
              >
                <img src={image.url} alt={image.alt || `${data.title || 'Project'} thumbnail ${imageIndex + 1}`} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
