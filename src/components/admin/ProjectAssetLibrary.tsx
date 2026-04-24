import React, { useMemo, useRef, useState } from 'react';

import type { ProjectAsset } from '../../types';
import styles from './ProjectAssetLibrary.module.scss';

type Props = {
  projectTitle?: string;
  projectId?: string;
  projectSlug?: string;
  assets: ProjectAsset[];
  loading?: boolean;
  onRefresh: () => Promise<void> | void;
  onSync: () => Promise<void> | void;
  onUpload: (file: File) => Promise<void> | void;
  onImportUrl: (url: string) => Promise<void> | void;
  onUpdate: (asset: ProjectAsset, payload: Partial<ProjectAsset>) => Promise<void> | void;
  onDelete: (asset: ProjectAsset) => Promise<void> | void;
};

type SortMode = 'usage-desc' | 'usage-asc' | 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc';

function formatBytes(value?: number | null) {
  if (!value) return 'Size unknown';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size >= 10 || unitIndex === 0 ? Math.round(size) : size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDimensions(asset: ProjectAsset) {
  if (!asset.width || !asset.height) return 'Dimensions unknown';
  const ratio = asset.width / asset.height;
  const orientation = ratio > 1.08 ? 'landscape' : ratio < 0.92 ? 'portrait' : 'square';
  return `${asset.width}x${asset.height} · ${orientation}`;
}

function formatDateTime(value?: string) {
  if (!value) return 'Date unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unknown';
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function compareDate(left?: string, right?: string) {
  return new Date(left || 0).getTime() - new Date(right || 0).getTime();
}

function sortAssets(assets: ProjectAsset[], sortMode: SortMode) {
  return [...assets].sort((left, right) => {
    if (sortMode === 'usage-desc') return (right.usageCount || 0) - (left.usageCount || 0);
    if (sortMode === 'usage-asc') return (left.usageCount || 0) - (right.usageCount || 0);
    if (sortMode === 'name-asc') return left.originalFilename.localeCompare(right.originalFilename);
    if (sortMode === 'name-desc') return right.originalFilename.localeCompare(left.originalFilename);
    if (sortMode === 'date-asc') return compareDate(left.createdAt, right.createdAt);
    return compareDate(right.createdAt, left.createdAt);
  });
}

function renderBadges(asset: ProjectAsset) {
  const isUsed = Boolean(asset.usageCount);
  const badges = [
    asset.kind,
    asset.status,
    asset.includeInAi === false ? 'AI off' : 'AI on',
    isUsed ? `used ${asset.usageCount}` : 'unused',
  ];

  return (
    <div className={styles.badges}>
      {badges.map((badge) => (
        <span key={badge} className={`${styles.badge} ${badge === 'unused' ? styles.badgeMuted : ''} ${badge.startsWith('used') ? styles.badgeUsed : ''}`}>
          {badge}
        </span>
      ))}
    </div>
  );
}

export default function ProjectAssetLibrary({
  projectTitle,
  projectId,
  projectSlug,
  assets,
  loading = false,
  onRefresh,
  onSync,
  onUpload,
  onImportUrl,
  onUpdate,
  onDelete,
}: Props) {
  const [url, setUrl] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('date-desc');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sortedAssets = useMemo(() => sortAssets(assets, sortMode), [assets, sortMode]);

  if (!projectId) {
    return (
      <div className={styles.emptyState}>
        Save the project first. After that, its image and video library will appear here.
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <div className={styles.title}>Project Assets</div>
          <div className={styles.subtitle}>
            {projectTitle ? `${projectTitle} library.` : 'Project library.'} Upload once, then reuse the same files in blocks.
          </div>
          <div className={styles.helper}>
            Sync scans {`public/uploads/projects/${projectSlug || 'project-slug'}`}. It adds only missing files and ignores identical ones by checksum.
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.buttonPrimary} onClick={() => fileInputRef.current?.click()} disabled={loading}>
            Upload file
          </button>
          <button type="button" className={styles.button} onClick={() => void onSync()} disabled={loading}>
            Sync folder
          </button>
          <button type="button" className={styles.button} onClick={() => void onRefresh()} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,video/x-m4v"
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
        <div className={styles.actions}>
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

      {!assets.length ? (
        <div className={styles.emptyState}>No assets yet. Upload files or sync the project folder.</div>
      ) : (
        <>
        <div className={styles.toolbar}>
          <div className={styles.summary}>
            {assets.length} assets · {assets.filter((asset) => asset.usageCount).length} used · {assets.filter((asset) => !asset.usageCount).length} unused
          </div>
          <label className={styles.sortLabel}>
            Sort
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className={styles.select}>
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="usage-desc">Used first</option>
              <option value="usage-asc">Unused first</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
          </label>
        </div>
        <div className={styles.grid}>
          {sortedAssets.map((asset) => (
            <div key={asset.id} className={styles.card}>
              <div className={styles.media}>
                {asset.kind === 'image' ? (
                  <img src={asset.publicUrl} alt={asset.altText || asset.originalFilename} />
                ) : asset.kind === 'video' ? (
                  <div className={styles.videoFallback}>Video</div>
                ) : (
                  <div className={styles.empty}>Asset</div>
                )}
              </div>

              <div className={styles.meta}>
                <div className={styles.filename}>{asset.originalFilename}</div>
                {renderBadges(asset)}
                <div className={styles.details}>
                  <span>{formatDimensions(asset)}</span>
                  <span>{formatBytes(asset.fileSize)}</span>
                  <span>Added {formatDateTime(asset.createdAt)}</span>
                  <span>{asset.includeInAi === false ? 'Excluded from Gemini generation' : 'Available for Gemini generation'}</span>
                  <span>{asset.usageCount ? `Used in ${asset.usageCount} place${asset.usageCount === 1 ? '' : 's'}` : 'Not used in page blocks'}</span>
                </div>
              </div>

              <div className={styles.footer}>
                <div className={styles.hint}>{asset.caption || asset.altText || 'No caption yet'}</div>
                <button
                  type="button"
                  className={styles.button}
                  disabled={loading}
                  onClick={() => void onUpdate(asset, { includeInAi: asset.includeInAi === false })}
                >
                  {asset.includeInAi === false ? 'Use in AI' : 'Exclude from AI'}
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  disabled={Boolean(asset.usageCount)}
                  onClick={() => void onDelete(asset)}
                >
                  Hide asset
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
