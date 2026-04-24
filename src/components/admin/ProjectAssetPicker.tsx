import React, { useRef, useState } from 'react';

import type { ProjectAsset } from '../../types';
import styles from './ProjectAssetPicker.module.scss';

type Props = {
  open: boolean;
  assets: ProjectAsset[];
  loading?: boolean;
  onClose: () => void;
  onSelect: (asset: ProjectAsset) => void;
  onRefresh: () => Promise<void> | void;
  onUpload: (file: File) => Promise<void> | void;
  onImportUrl: (url: string) => Promise<void> | void;
};

export default function ProjectAssetPicker({
  open,
  assets,
  loading = false,
  onClose,
  onSelect,
  onRefresh,
  onUpload,
  onImportUrl,
}: Props) {
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const imageAssets = assets.filter((asset) => asset.kind === 'image' && asset.status === 'active');

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <div className={styles.title}>Choose from project library</div>
            <div className={styles.subtitle}>Pick an existing image or add a new one to this project library.</div>
          </div>

          <button type="button" onClick={onClose} className={styles.closeButton}>
            Close
          </button>
        </div>

        <div className={styles.toolbar}>
          <button type="button" className={styles.buttonPrimary} onClick={() => fileInputRef.current?.click()} disabled={loading}>
            Upload file
          </button>
          <button type="button" className={styles.button} onClick={() => void onRefresh()} disabled={loading}>
            Refresh
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            await onUpload(file);
            event.currentTarget.value = '';
          }}
        />

        <div className={styles.urlForm}>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
            className={styles.input}
          />
          <div className={styles.toolbar}>
            <button
              type="button"
              className={styles.buttonPrimary}
              disabled={!url.trim() || loading}
              onClick={async () => {
                const nextUrl = url.trim();
                if (!nextUrl) return;
                await onImportUrl(nextUrl);
                setUrl('');
              }}
            >
              Import by URL
            </button>
          </div>
        </div>

        {!imageAssets.length ? (
          <div className={styles.emptyState}>No images in the project library yet.</div>
        ) : (
          <div className={styles.grid}>
            {imageAssets.map((asset) => (
              <button key={asset.id} type="button" className={styles.card} onClick={() => onSelect(asset)}>
                <div className={styles.media}>
                  <img src={asset.publicUrl} alt={asset.altText || asset.originalFilename} />
                </div>
                <div className={styles.filename}>{asset.originalFilename}</div>
                <div className={styles.meta}>{asset.usageCount ? `Used ${asset.usageCount} times` : 'Unused'}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
