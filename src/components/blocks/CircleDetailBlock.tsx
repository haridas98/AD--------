import React from 'react';
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
  if (!items.length) return null;

  return (
    <section className={styles.block} data-circle-detail data-project-block>
      {(data.title || data.description) ? (
        <div className={styles.head}>
          {data.title ? <h2>{data.title}</h2> : null}
          {data.description ? <p>{data.description}</p> : null}
        </div>
      ) : null}

      <div className={styles.grid}>
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
    </section>
  );
}
