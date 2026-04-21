import React, { useEffect, useState } from 'react';
import styles from './AdminAssetSourcePanel.module.scss';

type Props = {
  open: boolean;
  title?: string;
  initialUrl?: string;
  onUploadClick: () => void;
  onUrlApply: (url: string) => void;
  onClose: () => void;
};

export default function AdminAssetSourcePanel({
  open,
  title = 'Add image',
  initialUrl = '',
  onUploadClick,
  onUrlApply,
  onClose,
}: Props) {
  const [mode, setMode] = useState<'menu' | 'url'>('menu');
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    if (!open) return;
    setMode('menu');
    setUrl(initialUrl);
  }, [initialUrl, open]);

  if (!open) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        <button type="button" onClick={onClose} className={styles.closeButton}>
          x
        </button>
      </div>

      {mode === 'menu' ? (
        <div className={styles.actions}>
          <button type="button" onClick={onUploadClick} className={styles.primaryAction}>
            Upload from device
          </button>
          <button type="button" onClick={() => setMode('url')} className={styles.secondaryAction}>
            Add by URL
          </button>
        </div>
      ) : (
        <div className={styles.urlForm}>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
            className={styles.input}
          />
          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => {
                const nextUrl = url.trim();
                if (!nextUrl) return;
                onUrlApply(nextUrl);
              }}
              className={styles.primaryAction}
            >
              Apply URL
            </button>
            <button type="button" onClick={() => setMode('menu')} className={styles.secondaryAction}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
