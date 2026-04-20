import React from 'react';
import styles from './EditorialNoteBlock.module.scss';

interface EditorialNoteBlockProps {
  data: {
    eyebrow?: string;
    title?: string;
    note?: string;
    image?: string;
    alt?: string;
  };
}

export default function EditorialNoteBlock({ data }: EditorialNoteBlockProps) {
  if (!data.note && !data.image && !data.title) return null;

  return (
    <section className={styles.block} data-project-block>
      <div className={styles.inner}>
        <div className={styles.content}>
          {data.eyebrow ? <span className={styles.eyebrow}>{data.eyebrow}</span> : null}
          {data.title ? <h2>{data.title}</h2> : null}
          {data.note ? <blockquote className={styles.note}>{data.note}</blockquote> : null}
        </div>
        {data.image ? <img src={data.image} alt={data.alt || data.title || ''} className={styles.image} /> : null}
      </div>
    </section>
  );
}
