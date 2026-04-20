import React from 'react';
import styles from './CircleDetailBlock.module.scss';

type CircleItem = {
  image: string;
  alt?: string;
  label?: string;
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
              <img src={item.image} alt={item.alt || item.label || ''} />
            </div>
            {item.label ? <figcaption>{item.label}</figcaption> : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
