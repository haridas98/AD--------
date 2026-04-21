import React from 'react';
import { getCoverImageStyle, normalizeImageAsset } from '../../lib/imageTransforms';
import styles from './EditorialNoteBlock.module.scss';

interface EditorialNoteBlockProps {
  data: {
    eyebrow?: string;
    title?: string;
    note?: string;
    image?: any;
    alt?: string;
    crop?: {
      scale?: number;
      x?: number;
      y?: number;
    };
  };
}

export default function EditorialNoteBlock({ data }: EditorialNoteBlockProps) {
  const asset = normalizeImageAsset(typeof data.image === 'string' ? { url: data.image, alt: data.alt, crop: data.crop } : data.image);
  if (!data.note && !asset?.url && !data.title) return null;

  return (
    <section className={styles.block} data-project-block>
      <div className={styles.inner}>
        <div className={styles.content}>
          {data.eyebrow ? <span className={styles.eyebrow}>{data.eyebrow}</span> : null}
          {data.title ? <h2>{data.title}</h2> : null}
          {data.note ? <blockquote className={styles.note}>{data.note}</blockquote> : null}
        </div>
        {asset?.url ? <img src={asset.url} alt={asset.alt || data.alt || data.title || ''} className={styles.image} style={getCoverImageStyle(asset.crop)} /> : null}
      </div>
    </section>
  );
}
