import React, { useEffect, useMemo, useState } from 'react';
import Cropper from 'react-easy-crop';

import { editorOffsetToPercent, normalizeEditorCrop, percentToEditorOffset } from '../../lib/adminImageCrop';
import type { CoverCrop } from '../../lib/imageTransforms';
import styles from './AdminImageCropModal.module.scss';

type CropShape = 'rect' | 'round';

type Props = {
  open: boolean;
  title: string;
  imageUrl?: string;
  aspectRatio?: string;
  cropShape?: CropShape;
  initialCrop?: Partial<CoverCrop>;
  onClose: () => void;
  onSave: (crop: Required<CoverCrop>) => void;
};

type EditorSize = {
  width: number;
  height: number;
};

function parseAspectRatio(value?: string) {
  if (!value) return 1;
  const [width, height] = value.split('/').map((part) => Number(part.trim()));
  if (!width || !height) return 1;
  return width / height;
}

export default function AdminImageCropModal({
  open,
  title,
  imageUrl,
  aspectRatio = '1 / 1',
  cropShape = 'rect',
  initialCrop,
  onClose,
  onSave,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [editorSize, setEditorSize] = useState<EditorSize>({ width: 0, height: 0 });
  const aspect = useMemo(() => parseAspectRatio(aspectRatio), [aspectRatio]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !editorSize.width || !editorSize.height) return;
    const next = percentToEditorOffset(initialCrop, editorSize);
    setCrop({ x: next.x, y: next.y });
    setZoom(next.scale);
  }, [editorSize.width, editorSize.height, initialCrop, open, imageUrl]);

  if (!open) return null;

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleSave = () => {
    onSave(editorOffsetToPercent({ scale: zoom, x: crop.x, y: crop.y }, editorSize));
  };

  const current = normalizeEditorCrop(initialCrop);

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div className={styles.modal} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.header}>
          <div>
            <h3>{title}</h3>
            <p>Перетащи изображение внутри рамки и подстрой масштаб.</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close crop editor">
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.stageWrap}>
            <div className={styles.stage} style={{ aspectRatio }}>
              {imageUrl ? (
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  cropShape={cropShape}
                  showGrid={false}
                  objectFit="cover"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropSizeChange={setEditorSize}
                />
              ) : (
                <div className={styles.empty}>Сначала выбери изображение</div>
              )}
            </div>
          </div>

          <div className={styles.toolbar}>
            <label className={styles.zoomControl}>
              <span>Zoom</span>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.01"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                disabled={!imageUrl}
              />
            </label>

            <div className={styles.actions}>
              <button type="button" className={styles.secondaryButton} onClick={handleReset} disabled={!imageUrl}>
                Reset
              </button>
              <button type="button" className={styles.secondaryButton} onClick={onClose}>
                Cancel
              </button>
              <button type="button" className={styles.primaryButton} onClick={handleSave} disabled={!imageUrl}>
                Save framing
              </button>
            </div>
          </div>

          <div className={styles.meta}>
            <span>Current: {current.scale.toFixed(2)}x</span>
            <span>Drag to reposition</span>
          </div>
        </div>
      </div>
    </div>
  );
}
