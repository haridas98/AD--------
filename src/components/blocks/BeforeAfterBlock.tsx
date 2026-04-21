import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ReactCompareSlider } from 'react-compare-slider';
import { getCoverImageStyle, normalizeImageAsset } from '../../lib/imageTransforms';
import styles from './BeforeAfterBlock.module.scss';

interface BeforeAfterBlockProps {
  data: {
    beforeImage: any;
    afterImage: any;
    beforeAlt?: string;
    afterAlt?: string;
    title?: string;
    beforeCrop?: {
      scale?: number;
      x?: number;
      y?: number;
    };
    afterCrop?: {
      scale?: number;
      x?: number;
      y?: number;
    };
  };
}

export default function BeforeAfterBlock({ data }: BeforeAfterBlockProps) {
  const [sliderValue, setSliderValue] = useState(50);
  const beforeAsset = normalizeImageAsset(typeof data.beforeImage === 'string' ? { url: data.beforeImage, alt: data.beforeAlt, crop: data.beforeCrop } : data.beforeImage);
  const afterAsset = normalizeImageAsset(typeof data.afterImage === 'string' ? { url: data.afterImage, alt: data.afterAlt, crop: data.afterCrop } : data.afterImage);

  if (!beforeAsset?.url || !afterAsset?.url) return null;

  return (
    <motion.section
      className={styles.block}
      data-project-block
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {data.title && (
        <h3 className={styles.title}>{data.title}</h3>
      )}

      <div className={styles.sliderShell}>
        <ReactCompareSlider
          position={sliderValue}
          onPositionChange={setSliderValue}
          onlyHandleDraggable={false}
          transition=".18s ease-out"
          handle={
            <div className={styles.handle} aria-hidden="true">
              <span />
              <span />
            </div>
          }
          itemOne={
            <div className={styles.frame}>
              <img
                src={beforeAsset.url}
                alt={beforeAsset.alt || data.beforeAlt || 'Before'}
                className={styles.image}
                style={getCoverImageStyle(beforeAsset.crop)}
              />
              <div className={`${styles.label} ${styles.labelBefore}`}>Before</div>
            </div>
          }
          itemTwo={
            <div className={styles.frame}>
              <img
                src={afterAsset.url}
                alt={afterAsset.alt || data.afterAlt || 'After'}
                className={styles.image}
                style={getCoverImageStyle(afterAsset.crop)}
              />
              <div className={`${styles.label} ${styles.labelAfter}`}>After</div>
            </div>
          }
        />
      </div>
    </motion.section>
  );
}
