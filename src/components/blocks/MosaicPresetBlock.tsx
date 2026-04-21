import React, { useMemo, useState } from 'react';
import Lightbox from '../Lightbox';
import styles from './MosaicPresetBlock.module.scss';
import { getCoverImageStyle, normalizeImageAsset } from '../../lib/imageTransforms';

type MosaicImage = {
  url: string;
  alt?: string;
  crop?: {
    scale?: number;
    x?: number;
    y?: number;
  };
};

interface MosaicPresetBlockProps {
  data: {
    title?: string;
    preset?: 'a' | 'b';
    images?: Array<string | MosaicImage>;
  };
}

const presetClassMap: Record<string, string> = {
  a: styles.presetA,
  b: styles.presetB,
};

function normalizeImages(images: Array<string | MosaicImage> = []): MosaicImage[] {
  return images
    .map((image) => normalizeImageAsset(image))
    .filter((image) => image?.url);
}

export default function MosaicPresetBlock({ data }: MosaicPresetBlockProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = useMemo(() => normalizeImages(data.images).slice(0, 4), [data.images]);
  const preset = data.preset || 'a';

  if (!images.length) return null;

  return (
    <>
      <section className={styles.wrap} data-project-block>
        {data.title ? <h2 className={styles.title}>{data.title}</h2> : null}
        <div className={`${styles.block} ${presetClassMap[preset] || styles.presetA}`} data-mosaic-preset>
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              className={styles.cell}
              onClick={() => setLightboxIndex(index)}
            >
              <img src={image.url} alt={image.alt || data.title || ''} style={getCoverImageStyle(image.crop)} />
            </button>
          ))}
        </div>
      </section>

      {lightboxIndex !== null ? (
        <Lightbox
          images={images.map((image) => image.url)}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      ) : null}
    </>
  );
}
