import React, { useMemo, useState } from 'react';
import type { BlockItem } from '../blocks';
import styles from './AdminProjectMiniMap.module.scss';

type Props = {
  blocks: BlockItem[];
  activeBlockId?: string | null;
  onSelect: (blockId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

function getBlockImage(block: BlockItem) {
  const data = block.data || {};
  if (data.image) return typeof data.image === 'string' ? data.image : data.image?.url;
  if (data.beforeImage) return typeof data.beforeImage === 'string' ? data.beforeImage : data.beforeImage?.url;
  if (Array.isArray(data.images) && data.images[0]) return typeof data.images[0] === 'string' ? data.images[0] : data.images[0]?.url;
  if (Array.isArray(data.items) && data.items[0]?.image) return data.items[0].image;
  return '';
}

function getBlockLabel(block: BlockItem, index: number) {
  const title = block.data?.title;
  if (title) return title;
  return `${block.type} ${index + 1}`;
}

export default function AdminProjectMiniMap({ blocks, activeBlockId, onSelect, onReorder }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const beforeAfterOrder = useMemo(
    () =>
      blocks.reduce<Record<string, number>>((acc, block, index) => {
        if (block.type !== 'beforeAfter') return acc;
        acc[block.id || `before-after-${index}`] = Object.keys(acc).length + 1;
        return acc;
      }, {}),
    [blocks],
  );

  if (!blocks.length) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h4>Project layout</h4>
        <p>Drag blocks to change the page order. Click a block to jump to its editor.</p>
      </div>

      <div className={styles.grid}>
        {blocks.map((block, index) => {
          const id = block.id || `${block.type}-${index}`;
          const image = getBlockImage(block);
          const label = block.type === 'beforeAfter' ? `Before / After ${beforeAfterOrder[id] || index + 1}` : getBlockLabel(block, index);

          return (
            <button
              key={id}
              type="button"
              draggable
              onClick={() => onSelect(id)}
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (dragIndex === null || dragIndex === index) return;
                onReorder(dragIndex, index);
                setDragIndex(null);
              }}
              className={`${styles.card}${activeBlockId === id ? ` ${styles.cardActive}` : ''}`}
            >
              <div className={styles.cardTop}>
                <span className={styles.badge}>{block.type}</span>
                <span className={styles.order}>{index + 1}</span>
              </div>

              <div className={`${styles.preview} ${styles[`preview--${block.type}`] || ''}`}>
                {block.type === 'heroImage' ? (
                  <div className={styles.heroPreview} style={image ? { backgroundImage: `linear-gradient(180deg, rgba(12, 12, 12, 0.18), rgba(12, 12, 12, 0.74)), url(${image})` } : undefined}>
                    <div className={styles.heroLines}>
                      <span />
                      <span />
                    </div>
                  </div>
                ) : null}

                {block.type === 'metaInfo' ? (
                  <div className={styles.metaPreview}>
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                ) : null}

                {block.type === 'editorialNote' || block.type === 'sideBySide' ? (
                  <div className={styles.splitPreview}>
                    <div className={styles.textLines}>
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className={styles.mediaFrame} style={image ? { backgroundImage: `url(${image})` } : undefined} />
                  </div>
                ) : null}

                {block.type === 'typography' ? (
                  <div className={styles.textOnlyPreview}>
                    <span />
                    <span />
                    <span />
                  </div>
                ) : null}

                {block.type === 'imageGrid' || block.type === 'mosaicPreset' ? (
                  <div className={styles.mosaicPreview}>
                    <span style={image ? { backgroundImage: `url(${image})` } : undefined} />
                    <span />
                    <span />
                    <span />
                  </div>
                ) : null}

                {block.type === 'photoSequence' ? (
                  <div className={styles.photoSequencePreview}>
                    <span className={styles.photoSequenceWide} style={image ? { backgroundImage: `url(${image})` } : undefined} />
                    <span />
                    <span />
                  </div>
                ) : null}

                {block.type === 'refinedSlider' ? (
                  <div className={styles.sliderPreview}>
                    <div className={styles.sliderStage} style={image ? { backgroundImage: `url(${image})` } : undefined} />
                    <div className={styles.sliderThumbs}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                ) : null}

                {block.type === 'circleDetail' ? (
                  <div className={styles.circlePreview}>
                    {(block.data?.items || Array.from({ length: 5 })).slice(0, 5).map((_: any, itemIndex: number) => (
                      <span key={itemIndex} />
                    ))}
                  </div>
                ) : null}

                {block.type === 'beforeAfter' ? (
                  <div className={styles.beforeAfterPreview}>
                    <span className={styles.beforePane} />
                    <span className={styles.afterPane} />
                    <span className={styles.beforeAfterLine} />
                  </div>
                ) : null}

                {block.type === 'ctaSection' ? (
                  <div className={styles.ctaPreview}>
                    <span />
                    <span />
                    <em />
                  </div>
                ) : null}
              </div>

              <div className={styles.label}>{label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
