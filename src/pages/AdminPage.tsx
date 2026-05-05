import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import AdminAssetSourcePanel from '../components/admin/AdminAssetSourcePanel';
import AdminImageCropModal from '../components/admin/AdminImageCropModal';
import AdminProjectMiniMap from '../components/admin/AdminProjectMiniMap';
import AdminThemeEditor from '../components/admin/AdminThemeEditor';
import ProjectAssetLibrary from '../components/admin/ProjectAssetLibrary';
import ProjectAssetPicker from '../components/admin/ProjectAssetPicker';
import { normalizeEditorCrop } from '../lib/adminImageCrop';
import { buildBlogBaseBlocks, getBlogBlocksCover, parseBlogArticleSections, parseBlogPostBlocks } from '../lib/blogBlockTemplates';
import { getCoverImageStyle } from '../lib/imageTransforms';
import { normalizeHomepageSettings } from '../lib/homepageSettings';
import { buildProjectBaseBlocks, parseProjectContent } from '../lib/projectBlockTemplates';
import { PROJECT_STYLE_PRESET_OPTIONS } from '../lib/projectStylePresets';
import { normalizeThemeSettings } from '../lib/themeTokens';
import type { HomepageImageValue, HomepageSettings, Project, ProjectAsset, Testimonial } from '../types';

const BLOCK_TYPES = [
  { value: 'heroImage', label: 'Hero Image' },
  { value: 'imageGrid', label: 'Image Grid' },
  { value: 'metaInfo', label: 'Meta Info' },
  { value: 'typography', label: 'Typography' },
  { value: 'sideBySide', label: 'Side by Side' },
  { value: 'ctaSection', label: 'CTA Section' },
  { value: 'beforeAfter', label: 'Before / After' },
  { value: 'refinedSlider', label: 'Refined Slider' },
  { value: 'circleDetail', label: 'Circle Detail' },
  { value: 'editorialNote', label: 'Editorial Note' },
  { value: 'mosaicPreset', label: 'Mosaic Preset' },
  { value: 'photoSequence', label: 'Photo Sequence' },
];

function toSlug(t: string) {
  if (!t) return '';
  return t.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

async function getImageOrientation(file: File): Promise<'landscape' | 'portrait' | 'square'> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const orientation = await new Promise<'landscape' | 'portrait' | 'square'>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        if (image.naturalWidth > image.naturalHeight) resolve('landscape');
        else if (image.naturalWidth < image.naturalHeight) resolve('portrait');
        else resolve('square');
      };
      image.onerror = () => reject(new Error('Failed to read image dimensions'));
      image.src = objectUrl;
    });

    return orientation;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function getHeroImage(content: any[]) {
  return content.find((block: any) => block.type === 'heroImage')?.data?.image || '';
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  fontSize: '14px',
  fontFamily: 'inherit',
};
const miniBtn: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '4px',
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'transparent',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '12px',
};
const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  padding: '20px',
};
const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: '4px',
  color: 'rgba(255,255,255,0.6)',
  fontSize: '13px',
};
const panelStyle: React.CSSProperties = {
  display: 'grid',
  gap: '12px',
  padding: '12px',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
};
const slotGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: '10px',
};

type CropData = { scale: number; x: number; y: number };
type EditableImage = { url: string; alt?: string; crop: CropData; assetId?: string; projectId?: string };
type CircleItem = { label?: string; image: string; alt?: string; crop: CropData; assetId?: string };

function cleanCircleLabel(value?: string) {
  const label = String(value || '').trim();
  return /^Detail\s+\d+$/i.test(label) ? '' : label;
}

function ensureCrop(crop?: any): CropData {
  return normalizeEditorCrop(crop);
}

function toEditableImage(item?: any): EditableImage {
  if (!item) return { url: '', alt: '', crop: ensureCrop(), assetId: '', projectId: '' };
  if (typeof item === 'string') return { url: item, alt: '', crop: ensureCrop(), assetId: '', projectId: '' };
  return {
    url: item.url || '',
    alt: item.alt || '',
    crop: ensureCrop(item.crop),
    assetId: item.assetId || '',
    projectId: item.projectId || '',
  };
}

function homepageImageUrl(value?: HomepageImageValue | null) {
  if (!value) return '';
  return typeof value === 'string' ? value : value.url || '';
}

function homepageImageFromEditable(image: EditableImage): HomepageImageValue {
  if (!image.url) return '';
  if (image.assetId || image.projectId || image.alt) {
    return {
      url: image.url,
      assetId: image.assetId || '',
      projectId: image.projectId || '',
      alt: image.alt || '',
    };
  }
  return image.url;
}

function toCircleItem(item?: any): CircleItem {
  if (!item) return { label: '', image: '', alt: '', crop: ensureCrop(), assetId: '' };
  const label = cleanCircleLabel(item.label);
  return {
    label,
    image: item.image || '',
    alt: cleanCircleLabel(item.alt) || label,
    crop: ensureCrop(item.crop),
    assetId: item.assetId || '',
  };
}

function CoverPreview({
  url,
  crop,
  aspectRatio = '1 / 1',
  radius = '16px',
}: {
  url?: string;
  crop?: CropData;
  aspectRatio?: string;
  radius?: string;
}) {
  return (
    <div style={{ aspectRatio, borderRadius: radius, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
      {url ? (
        <img
          src={url}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            ...getCoverImageStyle(crop),
          }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.28)', fontSize: '12px' }}>Empty</div>
      )}
    </div>
  );
}

function actionButtonStyle(isPrimary = false): React.CSSProperties {
  return (
    {
      padding: '8px 12px',
      borderRadius: '999px',
      border: isPrimary ? '1px solid rgba(198,164,123,0.5)' : '1px solid rgba(255,255,255,0.12)',
      background: isPrimary ? 'rgba(198,164,123,0.14)' : 'rgba(255,255,255,0.03)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 600,
    }
  );
}

function mediaOverlayButtonStyle(tone: 'default' | 'danger' = 'default'): React.CSSProperties {
  return {
    width: '34px',
    height: '34px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: tone === 'danger' ? 'rgba(170,46,46,0.75)' : 'rgba(15,15,15,0.75)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 700,
    display: 'grid',
    placeItems: 'center',
    backdropFilter: 'blur(8px)',
  };
}

function EditableCoverFieldEditor({
  value,
  onChange,
  onUpload,
  onPickAsset,
  aspectRatio = '4 / 5',
  radius = '16px',
  cropShape = 'rect',
  cropEnabled = true,
  previewMaxWidth = 'min(100%, 420px)',
}: {
  value?: any;
  onChange: (next: EditableImage) => void;
  onUpload: (file: File) => Promise<any> | any;
  onPickAsset?: () => Promise<any> | any;
  aspectRatio?: string;
  radius?: string;
  cropShape?: 'rect' | 'round';
  cropEnabled?: boolean;
  previewMaxWidth?: string;
}) {
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const current = toEditableImage(value);
  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <div style={{ display: 'grid', gap: '10px', width: '100%', maxWidth: previewMaxWidth }}>
      <div style={{ position: 'relative' }}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsSourceOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setIsSourceOpen(true);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <CoverPreview url={current.url} crop={current.crop} aspectRatio={aspectRatio} radius={radius} />
          {!current.url ? (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', fontSize: '26px', fontWeight: 700, background: 'rgba(15,15,15,0.28)', borderRadius: radius }}>
              +
            </div>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={async (e) => {
            if (!e.target.files?.[0]) return;
            const uploaded = await onUpload(e.target.files[0]);
            if (uploaded?.url) {
              onChange({
                ...current,
                url: uploaded.url,
                crop: ensureCrop(),
                assetId: uploaded.id || uploaded.assetId || '',
                projectId: '',
              });
            }
            e.currentTarget.value = '';
          }}
          style={{ display: 'none' }}
        />

        {current.url ? (
          <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px' }}>
            {cropEnabled ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsCropOpen(true);
                }}
                style={mediaOverlayButtonStyle()}
              >
                edit
              </button>
            ) : null}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange({ ...current, url: '', crop: ensureCrop(), assetId: '', projectId: '' });
              }}
              style={mediaOverlayButtonStyle('danger')}
            >
              x
            </button>
          </div>
        ) : null}
      </div>

      <AdminAssetSourcePanel
        open={isSourceOpen}
        title={current.url ? 'Replace image' : 'Add image'}
        initialUrl={current.url}
        onUploadClick={() => {
          setIsSourceOpen(false);
          openFilePicker();
        }}
        onLibraryClick={onPickAsset ? async () => {
          const picked = await onPickAsset();
          if (picked?.url || picked?.publicUrl) {
            onChange({
              ...current,
              url: picked.url || picked.publicUrl,
              alt: picked.altText || picked.caption || current.alt || '',
              crop: ensureCrop(),
              assetId: picked.id || picked.assetId || '',
              projectId: picked.projectId || current.projectId || '',
            });
            setIsSourceOpen(false);
          }
        } : undefined}
        onUrlApply={(nextUrl) => {
          onChange({ ...current, url: nextUrl, crop: ensureCrop(), assetId: '', projectId: '' });
          setIsSourceOpen(false);
        }}
        onClose={() => setIsSourceOpen(false)}
      />

      <AdminImageCropModal
        open={isCropOpen}
        title="Edit image framing"
        imageUrl={current.url}
        aspectRatio={aspectRatio}
        cropShape={cropShape}
        initialCrop={current.crop}
        onClose={() => setIsCropOpen(false)}
        onSave={(crop) => {
          onChange({ ...current, crop });
          setIsCropOpen(false);
        }}
      />
    </div>
  );
}

function BasicCoverFieldEditor({
  url,
  crop,
  assetId,
  onUrlChange,
  onCropChange,
  onAssetIdChange,
  onUpload,
  onPickAsset,
  openCropOnPortraitUpload = false,
  aspectRatio = '4 / 5',
  radius = '16px',
  cropShape = 'rect',
  cropEnabled = true,
  previewMaxWidth = 'min(100%, 420px)',
}: {
  url?: string;
  crop?: CropData;
  assetId?: string;
  onUrlChange: (next: string) => void;
  onCropChange: (next: CropData) => void;
  onAssetIdChange?: (next: string) => void;
  onUpload: (file: File) => Promise<any> | any;
  onPickAsset?: () => Promise<any> | any;
  openCropOnPortraitUpload?: boolean;
  aspectRatio?: string;
  radius?: string;
  cropShape?: 'rect' | 'round';
  cropEnabled?: boolean;
  previewMaxWidth?: string;
}) {
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentCrop = ensureCrop(crop);
  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <div style={{ display: 'grid', gap: '10px', width: '100%', maxWidth: previewMaxWidth }}>
      <div style={{ position: 'relative' }}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsSourceOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setIsSourceOpen(true);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <CoverPreview url={url} crop={currentCrop} aspectRatio={aspectRatio} radius={radius} />
          {!url ? (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', fontSize: '26px', fontWeight: 700, background: 'rgba(15,15,15,0.28)', borderRadius: radius }}>
              +
            </div>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={async (e) => {
            if (!e.target.files?.[0]) return;
            const file = e.target.files[0];
            const orientation = await getImageOrientation(file).catch(() => 'landscape' as const);
            const uploaded = await onUpload(file);
            if (uploaded?.url) {
              onUrlChange(uploaded.url);
              onCropChange(ensureCrop());
              onAssetIdChange?.(uploaded.id || uploaded.assetId || '');
              if (openCropOnPortraitUpload && orientation === 'portrait') {
                setIsCropOpen(true);
              }
            }
            e.currentTarget.value = '';
          }}
          style={{ display: 'none' }}
        />

        {url ? (
          <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px' }}>
            {cropEnabled ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsCropOpen(true);
                }}
                style={mediaOverlayButtonStyle()}
              >
                edit
              </button>
            ) : null}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onUrlChange('');
                onCropChange(ensureCrop());
                onAssetIdChange?.('');
              }}
              style={mediaOverlayButtonStyle('danger')}
            >
              x
            </button>
          </div>
        ) : null}
      </div>

      <AdminAssetSourcePanel
        open={isSourceOpen}
        title={url ? 'Replace image' : 'Add image'}
        initialUrl={url || ''}
        onUploadClick={() => {
          setIsSourceOpen(false);
          openFilePicker();
        }}
        onLibraryClick={onPickAsset ? async () => {
          const picked = await onPickAsset();
          if (picked?.url || picked?.publicUrl) {
            onUrlChange(picked.url || picked.publicUrl);
            onCropChange(ensureCrop());
            onAssetIdChange?.(picked.id || picked.assetId || '');
            setIsSourceOpen(false);
          }
        } : undefined}
        onUrlApply={(nextUrl) => {
          onUrlChange(nextUrl);
          onCropChange(ensureCrop());
          onAssetIdChange?.('');
          setIsSourceOpen(false);
        }}
        onClose={() => setIsSourceOpen(false)}
      />

      <AdminImageCropModal
        open={isCropOpen}
        title="Edit image framing"
        imageUrl={url}
        aspectRatio={aspectRatio}
        cropShape={cropShape}
        initialCrop={currentCrop}
        onClose={() => setIsCropOpen(false)}
        onSave={(nextCrop) => {
          onCropChange(nextCrop);
          setIsCropOpen(false);
        }}
      />
    </div>
  );
}

function HomeSettingsEditor({
  value,
  onChange,
  onSave,
  onUpload,
  onPickProjectAsset,
  saving,
  isCompact,
}: {
  value: HomepageSettings;
  onChange: (next: HomepageSettings) => void;
  onSave: () => void;
  onUpload: (file: File, field: string) => Promise<any>;
  onPickProjectAsset?: () => Promise<ProjectAsset | null>;
  saving: boolean;
  isCompact: boolean;
}) {
  const settings = normalizeHomepageSettings(value);
  const columnGrid = { display: 'grid', gridTemplateColumns: isCompact ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '12px' };

  const setGroupField = (group: keyof HomepageSettings, field: string, nextValue: any) => {
    onChange({ ...settings, [group]: { ...(settings as any)[group], [field]: nextValue } });
  };

  const setCollageImage = (field: keyof HomepageSettings['collage']['images'], nextValue: HomepageImageValue) => {
    setGroupField('collage', 'images', { ...settings.collage.images, [field]: nextValue });
  };

  const setApproachItem = (index: number, field: string, nextValue: string) => {
    const nextItems = [...settings.approach.items];
    nextItems[index] = { ...nextItems[index], [field]: nextValue };
    setGroupField('approach', 'items', nextItems);
  };

  const setDetailImage = (index: number, nextValue: HomepageImageValue) => {
    const nextImages = [...(settings.detail.images || [])];
    nextImages[index] = nextValue;
    setGroupField('detail', 'images', nextImages);
  };

  const inputField = (
    label: string,
    value: string | number,
    onNext: (nextValue: any) => void,
    opts: { textarea?: boolean; rows?: number; type?: string } = {},
  ) => (
    <label style={labelStyle}>
      {label}
      {opts.textarea ? (
        <textarea
          rows={opts.rows || 3}
          value={String(value ?? '')}
          onChange={(event) => onNext(event.target.value)}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.45 }}
        />
      ) : (
        <input
          type={opts.type || 'text'}
          value={value ?? ''}
          onChange={(event) => onNext(opts.type === 'number' ? Number(event.target.value) : event.target.value)}
          style={inputStyle}
        />
      )}
    </label>
  );

  const imageField = (
    label: string,
    value: HomepageImageValue,
    onNext: (nextValue: HomepageImageValue) => void,
    uploadKey: string,
    aspectRatio = '16 / 10',
    allowProjectAsset = true,
  ) => (
    <div style={{ display: 'grid', gap: '8px' }}>
      <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: '13px' }}>{label}</div>
      <EditableCoverFieldEditor
        value={toEditableImage(value)}
        aspectRatio={aspectRatio}
        cropEnabled={false}
        previewMaxWidth="100%"
        onChange={(nextImage) => onNext(homepageImageFromEditable(nextImage))}
        onUpload={(file) => onUpload(file, uploadKey)}
        onPickAsset={allowProjectAsset && onPickProjectAsset ? async () => {
          const asset = await onPickProjectAsset();
          return asset ? { ...asset, url: asset.publicUrl } : null;
        } : undefined}
      />
    </div>
  );

  const section = (title: string, children: React.ReactNode) => (
    <section style={{ ...cardStyle, display: 'grid', gap: '14px' }}>
      <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>{title}</h3>
      {children}
    </section>
  );

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: '#fff', margin: 0, fontSize: '22px' }}>Home page</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '6px 0 0', fontSize: '13px' }}>Texts, images, sliders and reviews used on the main page.</p>
        </div>
        <button type="button" className="btn-primary" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Home'}</button>
      </div>

      {section('Hero', (
        <div style={columnGrid}>
          {inputField('Center title', settings.hero.title, (next) => setGroupField('hero', 'title', next))}
          {imageField('Hero image', settings.hero.image, (next) => setGroupField('hero', 'image', homepageImageUrl(next)), 'hero', '16 / 9', false)}
        </div>
      ))}

      {section('Collage section', (
        <div style={{ display: 'grid', gap: '14px' }}>
          <div style={columnGrid}>
            {inputField('Title', settings.collage.title, (next) => setGroupField('collage', 'title', next))}
            {inputField('Quote', settings.collage.quote, (next) => setGroupField('collage', 'quote', next), { textarea: true, rows: 2 })}
            {inputField('Main text', settings.collage.text, (next) => setGroupField('collage', 'text', next), { textarea: true, rows: 3 })}
            {inputField('Card title', settings.collage.cardTitle, (next) => setGroupField('collage', 'cardTitle', next))}
            {inputField('Card text', settings.collage.cardText, (next) => setGroupField('collage', 'cardText', next), { textarea: true, rows: 3 })}
          </div>
          <div style={{ ...columnGrid, gridTemplateColumns: isCompact ? '1fr' : 'repeat(5, minmax(0, 1fr))' }}>
            {imageField('Primary', settings.collage.images.primary, (next) => setCollageImage('primary', next), 'collage-primary', '4 / 3')}
            {imageField('Small 1', settings.collage.images.smallOne, (next) => setCollageImage('smallOne', next), 'collage-small-one', '1 / 1')}
            {imageField('Wide', settings.collage.images.wide, (next) => setCollageImage('wide', next), 'collage-wide', '16 / 10')}
            {imageField('Tall', settings.collage.images.tall, (next) => setCollageImage('tall', next), 'collage-tall', '4 / 5')}
            {imageField('Small 2', settings.collage.images.smallTwo, (next) => setCollageImage('smallTwo', next), 'collage-small-two', '1 / 1')}
          </div>
        </div>
      ))}

      {section('Alexandra feature', (
        <div style={columnGrid}>
          {inputField('Quote', settings.feature.quote, (next) => setGroupField('feature', 'quote', next), { textarea: true, rows: 3 })}
          {imageField('Alexandra image', settings.feature.image, (next) => setGroupField('feature', 'image', homepageImageUrl(next)), 'feature', '16 / 10', false)}
          {inputField('Dark card title', settings.feature.darkTitle, (next) => setGroupField('feature', 'darkTitle', next))}
          {inputField('Dark card text', settings.feature.darkText, (next) => setGroupField('feature', 'darkText', next), { textarea: true, rows: 3 })}
          {inputField('Link label', settings.feature.linkLabel, (next) => setGroupField('feature', 'linkLabel', next))}
          {inputField('Link URL', settings.feature.linkHref, (next) => setGroupField('feature', 'linkHref', next))}
          {inputField('Light card title', settings.feature.lightTitle, (next) => setGroupField('feature', 'lightTitle', next))}
          {inputField('Light card text', settings.feature.lightText, (next) => setGroupField('feature', 'lightText', next), { textarea: true, rows: 3 })}
        </div>
      ))}

      {section('Project carousel', (
        <div style={columnGrid}>
          {inputField('Label', settings.showcase.label, (next) => setGroupField('showcase', 'label', next))}
          {inputField('Title', settings.showcase.title, (next) => setGroupField('showcase', 'title', next), { textarea: true, rows: 2 })}
          {inputField('Projects in carousel', settings.showcase.projectCount, (next) => setGroupField('showcase', 'projectCount', next), { type: 'number' })}
        </div>
      ))}

      {section('Design reading block', (
        <div style={{ display: 'grid', gap: '14px' }}>
          <div style={columnGrid}>
            {inputField('Label', settings.approach.label, (next) => setGroupField('approach', 'label', next))}
            {inputField('Title', settings.approach.title, (next) => setGroupField('approach', 'title', next), { textarea: true, rows: 2 })}
            {imageField('Background image', settings.approach.image, (next) => setGroupField('approach', 'image', next), 'approach', '16 / 10')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
            {settings.approach.items.slice(0, 3).map((item, index) => (
              <div key={index} style={panelStyle}>
                {inputField('Number', item.number, (next) => setApproachItem(index, 'number', next))}
                {inputField('Title', item.title, (next) => setApproachItem(index, 'title', next))}
                {inputField('Text', item.text, (next) => setApproachItem(index, 'text', next), { textarea: true, rows: 3 })}
              </div>
            ))}
          </div>
        </div>
      ))}

      {section('Detail gallery', (
        <div style={{ display: 'grid', gap: '14px' }}>
          <div style={columnGrid}>
            {inputField('Label', settings.detail.label, (next) => setGroupField('detail', 'label', next))}
            {inputField('Title', settings.detail.title, (next) => setGroupField('detail', 'title', next))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr 1fr' : 'repeat(6, minmax(0, 1fr))', gap: '10px' }}>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index}>
                {imageField(`Image ${index + 1}`, settings.detail.images[index] || '', (next) => setDetailImage(index, next), `detail-${index}`, '4 / 3')}
              </div>
            ))}
          </div>
        </div>
      ))}

      {section('Reviews', (
        <div style={{ display: 'grid', gap: '14px' }}>
          <div style={columnGrid}>
            {inputField('Label', settings.testimonials.label, (next) => setGroupField('testimonials', 'label', next))}
            {inputField('Title', settings.testimonials.title, (next) => setGroupField('testimonials', 'title', next), { textarea: true, rows: 2 })}
            {inputField('Visible reviews', settings.testimonials.count, (next) => setGroupField('testimonials', 'count', next), { type: 'number' })}
          </div>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Review cards and project links are edited in the Testimonials tab.</p>
        </div>
      ))}

      {section('Final CTA', (
        <div style={columnGrid}>
          {inputField('Label', settings.cta.label, (next) => setGroupField('cta', 'label', next))}
          {inputField('Title', settings.cta.title, (next) => setGroupField('cta', 'title', next), { textarea: true, rows: 2 })}
          {inputField('Button label', settings.cta.buttonLabel, (next) => setGroupField('cta', 'buttonLabel', next))}
          {inputField('Button URL', settings.cta.buttonHref, (next) => setGroupField('cta', 'buttonHref', next))}
        </div>
      ))}

      <button type="button" className="btn-primary" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Home'}</button>
    </div>
  );
}

function TestimonialsEditor({
  testimonials,
  projects,
  onCreate,
  onSave,
  onDelete,
  onUpload,
  saving,
  isCompact,
}: {
  testimonials: Testimonial[];
  projects: Project[];
  onCreate: () => void;
  onSave: (id: string, payload: Partial<Testimonial>) => void;
  onDelete: (id: string) => void;
  onUpload: (file: File, field: string) => Promise<any>;
  saving: boolean;
  isCompact: boolean;
}) {
  const [drafts, setDrafts] = useState<Testimonial[]>([]);

  useEffect(() => {
    setDrafts([...(testimonials || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
  }, [testimonials]);

  const columnGrid = {
    display: 'grid',
    gridTemplateColumns: isCompact ? '1fr' : 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
  };

  const updateDraft = (id: string, field: keyof Testimonial, value: any) => {
    setDrafts((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const getDraft = (id: string) => drafts.find((item) => item.id === id);

  const inputField = (
    label: string,
    value: string | number | boolean | null | undefined,
    onNext: (nextValue: any) => void,
    opts: { textarea?: boolean; rows?: number; type?: string } = {},
  ) => (
    <label style={labelStyle}>
      {label}
      {opts.textarea ? (
        <textarea
          rows={opts.rows || 3}
          value={String(value ?? '')}
          onChange={(event) => onNext(event.target.value)}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.45 }}
        />
      ) : (
        <input
          type={opts.type || 'text'}
          value={String(value ?? '')}
          onChange={(event) => onNext(opts.type === 'number' ? Number(event.target.value) : event.target.value)}
          style={inputStyle}
        />
      )}
    </label>
  );

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: '#fff', margin: 0, fontSize: '22px' }}>Testimonials</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '6px 0 0', fontSize: '13px' }}>Reviews from the database, with optional project connection.</p>
        </div>
        <button type="button" className="btn-primary" onClick={onCreate} disabled={saving}>{saving ? 'Saving...' : '+ Add review'}</button>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {drafts.map((item, index) => (
          <details key={item.id} open={index < 2} style={panelStyle}>
            <summary style={{ cursor: 'pointer', color: '#fff', fontSize: '14px', fontWeight: 700 }}>
              {String(index + 1).padStart(2, '0')} - {item.author || 'Client'}
            </summary>
            <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
              <div style={columnGrid}>
                {inputField('Author', item.author, (next) => updateDraft(item.id, 'author', next))}
                {inputField('Date', item.date || '', (next) => updateDraft(item.id, 'date', next))}
                {inputField('Text', item.text, (next) => updateDraft(item.id, 'text', next), { textarea: true, rows: 4 })}
                {inputField('Sort order', item.sortOrder || 0, (next) => updateDraft(item.id, 'sortOrder', next), { type: 'number' })}
                <label style={labelStyle}>
                  Linked project
                  <select
                    value={item.projectId || ''}
                    onChange={(event) => updateDraft(item.id, 'projectId', event.target.value)}
                    style={inputStyle}
                  >
                    <option value="" style={{ background: '#141414' }}>No project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id} style={{ background: '#141414' }}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </label>
                {inputField('Project link text', item.projectText || '', (next) => updateDraft(item.id, 'projectText', next))}
                {inputField('Source label', item.link || '', (next) => updateDraft(item.id, 'link', next))}
                {inputField('Source URL', item.linkHref || '', (next) => updateDraft(item.id, 'linkHref', next))}
                {inputField('Legacy project URL', item.projectHref || '', (next) => updateDraft(item.id, 'projectHref', next))}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={item.isPublished !== false}
                    onChange={(event) => updateDraft(item.id, 'isPublished', event.target.checked)}
                  />
                  Published
                </label>
              </div>

              <div style={{ maxWidth: isCompact ? '100%' : '280px' }}>
                <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: '13px', marginBottom: '8px' }}>Avatar / fallback image</div>
                <EditableCoverFieldEditor
                  value={item.image || ''}
                  aspectRatio="1 / 1"
                  cropEnabled={false}
                  previewMaxWidth="100%"
                  onChange={(nextImage) => updateDraft(item.id, 'image', nextImage.url)}
                  onUpload={(file) => onUpload(file, `testimonial-${item.id}`)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const draft = getDraft(item.id);
                    if (draft) onSave(item.id, draft);
                  }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save review'}
                </button>
                <button type="button" style={{ ...miniBtn, color: '#ff8a80' }} onClick={() => onDelete(item.id)} disabled={saving}>Delete</button>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function MosaicPresetEditor({
  data,
  idx,
  onUpdate,
  onUpload,
  onPickAsset,
  formTitle,
  compact = false,
}: {
  data: any;
  idx: number;
  onUpdate: (i: number, f: string, v: any) => void;
  onUpload: (i: number, f: string, file: File) => Promise<any> | any;
  onPickAsset?: () => Promise<any> | any;
  formTitle: string;
  compact?: boolean;
}) {
  const images = Array.from({ length: 4 }, (_, index) => toEditableImage((data.images || [])[index]));
  const preset = data.preset === 'b' ? 'b' : 'a';
  const areas = preset === 'b' ? ['left', 'top', 'bottom1', 'bottom2'] : ['hero', 'side1', 'side2', 'base'];

  const updateImage = (imageIndex: number, nextImage: EditableImage) => {
    const next = [...images];
    next[imageIndex] = nextImage;
    onUpdate(idx, 'images', next.filter((item) => item.url));
  };

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'grid', gap: '8px' }}>
        <label style={labelStyle}>Title<input value={data.title || ''} onChange={(e) => onUpdate(idx, 'title', e.target.value)} style={inputStyle} /></label>
        <label style={labelStyle}>Preset<select value={data.preset || 'a'} onChange={(e) => onUpdate(idx, 'preset', e.target.value)} style={inputStyle}><option value="a" style={{ background: '#141414' }}>Preset A</option><option value="b" style={{ background: '#141414' }}>Preset B</option></select></label>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '10px',
          gridTemplateColumns: compact ? '1fr 1fr' : preset === 'b' ? '0.85fr 1.15fr 1.15fr' : '1.25fr 0.75fr 0.75fr',
          gridTemplateRows: compact ? 'repeat(3, minmax(0, auto))' : 'repeat(2, minmax(0, 1fr))',
          gridTemplateAreas: compact
            ? preset === 'b'
              ? `"top top" "left bottom1" "left bottom2"`
              : `"hero hero" "side1 side2" "base base"`
            : preset === 'b'
              ? `"left top top" "left bottom1 bottom2"`
              : `"hero side1 side2" "hero base base"`,
          alignItems: 'stretch',
        }}
      >
        {areas.map((area, imageIndex) => (
          <div key={area} style={{ gridArea: area, minWidth: 0, minHeight: 0 }}>
            <EditableCoverFieldEditor
              value={images[imageIndex]}
              aspectRatio={
                compact
                  ? area === 'hero' || area === 'top' || area === 'base'
                    ? '16 / 10'
                    : '1 / 1'
                  : area === 'hero' || area === 'left'
                    ? '4 / 5'
                    : area === 'base' || area === 'top'
                      ? '16 / 10'
                      : '1 / 1'
              }
              previewMaxWidth="100%"
              onChange={(nextImage) => updateImage(imageIndex, { ...nextImage, alt: nextImage.alt || formTitle })}
              onUpload={(file) => onUpload(idx, `mosaicUpload-${imageIndex}`, file)}
              onPickAsset={onPickAsset}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CircleDetailEditor({
  data,
  idx,
  onUpdate,
  onUpload,
  onPickAsset,
  formTitle,
  compact = false,
}: {
  data: any;
  idx: number;
  onUpdate: (i: number, f: string, v: any) => void;
  onUpload: (i: number, f: string, file: File) => Promise<any> | any;
  onPickAsset?: () => Promise<any> | any;
  formTitle: string;
  compact?: boolean;
}) {
  const items = Array.from(
    { length: Math.min(Math.max((data.items || []).length + 1, 5), 10) },
    (_, index) => toCircleItem((data.items || [])[index]),
  );

  const updateItem = (itemIndex: number, nextItem: CircleItem) => {
    const next = [...items];
    next[itemIndex] = nextItem;
    onUpdate(idx, 'items', next.filter((item) => item.image || item.label));
  };

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'grid', gap: '8px' }}>
        <label style={labelStyle}>Title<input value={data.title || ''} onChange={(e) => onUpdate(idx, 'title', e.target.value)} style={inputStyle} /></label>
        <label style={labelStyle}>Description<textarea rows={3} value={data.description || ''} onChange={(e) => onUpdate(idx, 'description', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></label>
        <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '12px' }}>The next dimmed slot appears automatically. Up to 10 circles.</div>
      </div>

      <div
        style={{
          ...slotGridStyle,
          gridTemplateColumns: compact ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))',
          justifyContent: 'stretch',
          alignItems: 'start',
        }}
      >
        {items.map((item, itemIndex) => (
          <div key={itemIndex} style={{ display: 'grid', gap: '8px', opacity: item.image || item.label ? 1 : 0.62, justifyItems: 'center' }}>
            <EditableCoverFieldEditor
              value={{ url: item.image, alt: item.alt || item.label || formTitle, crop: item.crop, assetId: item.assetId || '' }}
              radius="999px"
              cropShape="round"
              previewMaxWidth={compact ? '100%' : '156px'}
              onChange={(nextImage) => updateItem(itemIndex, { ...item, image: nextImage.url, alt: nextImage.alt || item.label || formTitle, crop: nextImage.crop, assetId: nextImage.assetId || '' })}
              onUpload={(file) => onUpload(idx, `circleUpload-${itemIndex}`, file)}
              onPickAsset={onPickAsset}
            />
            <input
              value={item.label || ''}
              onChange={(e) => updateItem(itemIndex, { ...item, label: e.target.value, alt: e.target.value || formTitle })}
              placeholder={`Circle ${itemIndex + 1}`}
              style={{ ...inputStyle, maxWidth: compact ? '100%' : '156px' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function RefinedSliderEditor({
  data,
  idx,
  onUpdate,
  onUpload,
  onPickAsset,
  formTitle,
  compact = false,
}: {
  data: any;
  idx: number;
  onUpdate: (i: number, f: string, v: any) => void;
  onUpload: (i: number, f: string, file: File) => Promise<any> | any;
  onPickAsset?: () => Promise<any> | any;
  formTitle: string;
  compact?: boolean;
}) {
  const images = Array.from(
    { length: Math.min(Math.max((data.images || []).length + 1, 4), 12) },
    (_, index) => toEditableImage((data.images || [])[index]),
  );

  const updateImage = (imageIndex: number, nextImage: EditableImage) => {
    const next = [...images];
    next[imageIndex] = nextImage;
    onUpdate(idx, 'images', next.filter((item) => item.url));
  };

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'grid', gap: '8px' }}>
        <label style={labelStyle}>Title<input value={data.title || ''} onChange={(e) => onUpdate(idx, 'title', e.target.value)} style={inputStyle} /></label>
        <label style={labelStyle}>Description<textarea rows={3} value={data.description || ''} onChange={(e) => onUpdate(idx, 'description', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></label>
        <label style={labelStyle}>Thumbnail Position<select value={data.thumbnailPosition || 'bottom'} onChange={(e) => onUpdate(idx, 'thumbnailPosition', e.target.value)} style={inputStyle}><option value="bottom" style={{ background: '#141414' }}>Bottom</option><option value="left" style={{ background: '#141414' }}>Left</option><option value="right" style={{ background: '#141414' }}>Right</option></select></label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
        {images.map((image, imageIndex) => (
          <EditableCoverFieldEditor
            key={imageIndex}
            value={image}
            aspectRatio="4 / 5"
            cropEnabled={false}
            previewMaxWidth="100%"
            onChange={(nextImage) => updateImage(imageIndex, { ...nextImage, alt: nextImage.alt || formTitle })}
            onUpload={(file) => onUpload(idx, `sliderUpload-${imageIndex}`, file)}
            onPickAsset={onPickAsset}
          />
        ))}
      </div>
    </div>
  );
}

function HomepageProjectAssetPicker({
  open,
  projects,
  selectedProjectId,
  assets,
  loading,
  onProjectChange,
  onClose,
  onSelect,
  onRefresh,
}: {
  open: boolean;
  projects: Project[];
  selectedProjectId: string;
  assets: ProjectAsset[];
  loading: boolean;
  onProjectChange: (projectId: string) => void;
  onClose: () => void;
  onSelect: (asset: ProjectAsset) => void;
  onRefresh: () => void;
}) {
  if (!open) return null;

  const imageAssets = assets.filter((asset) => asset.kind === 'image' && asset.status === 'active');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 240, display: 'grid', placeItems: 'center', padding: '24px', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}>
      <div style={{ width: 'min(1120px, 100%)', maxHeight: '86vh', overflow: 'auto', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.12)', background: '#171717', boxShadow: '0 34px 90px rgba(0,0,0,0.45)' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', padding: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(23,23,23,0.94)', backdropFilter: 'blur(10px)' }}>
          <div>
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: 800 }}>Choose project asset</div>
            <div style={{ color: 'rgba(255,255,255,0.48)', fontSize: '12px', marginTop: '4px' }}>The selected image will link to this project on the public page.</div>
          </div>
          <button type="button" onClick={onClose} style={actionButtonStyle()}>
            Close
          </button>
        </div>

        <div style={{ display: 'grid', gap: '16px', padding: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) auto', gap: '10px', alignItems: 'end' }}>
            <label style={labelStyle}>
              Project
              <select
                value={selectedProjectId}
                onChange={(event) => onProjectChange(event.target.value)}
                style={inputStyle}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id} style={{ background: '#141414' }}>
                    {project.title}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={onRefresh} disabled={loading || !selectedProjectId} style={actionButtonStyle(true)}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {!selectedProjectId ? (
            <div style={{ ...panelStyle, color: 'rgba(255,255,255,0.55)', textAlign: 'center', padding: '28px' }}>No project selected.</div>
          ) : !imageAssets.length ? (
            <div style={{ ...panelStyle, color: 'rgba(255,255,255,0.55)', textAlign: 'center', padding: '28px' }}>No active images in this project asset library.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {imageAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onSelect(asset)}
                  style={{ display: 'grid', gap: '8px', padding: '8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ display: 'block', aspectRatio: '4 / 3', overflow: 'hidden', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                    <img src={asset.publicUrl} alt={asset.altText || asset.originalFilename} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </span>
                  <span style={{ fontSize: '12px', lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.originalFilename}</span>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>{asset.width && asset.height ? `${asset.width} x ${asset.height}` : 'Project asset'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage({ data, refresh }: any) {
  const [authed, setAuthed] = useState(!!api.getStoredToken());
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [adminData, setAdminData] = useState(data || { projects: [], categories: [], blogPosts: [], testimonials: [], themeSettings: normalizeThemeSettings(), homepageSettings: normalizeHomepageSettings() });
  const [stats, setStats] = useState({ projectCount: 0, publishedCount: 0, blogCount: 0, categoryCount: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [baToggles, setBaToggles] = useState<Record<string, boolean>>({});
  const [catForm, setCatForm] = useState<any>(null);
  const [catSelId, setCatSelId] = useState('');
  const [selId, setSelId] = useState('');
  const [form, setForm] = useState<any>(null);
  const [blogSelId, setBlogSelId] = useState('');
  const [blogForm, setBlogForm] = useState<any>(null);
  const [blogBlocks, setBlogBlocks] = useState<any[]>([]);
  const [blogArticleSections, setBlogArticleSections] = useState<any[]>([]);
  const [activeBlogBlockId, setActiveBlogBlockId] = useState<string | null>(null);
  const [themeForm, setThemeForm] = useState(normalizeThemeSettings(data?.themeSettings));
  const [homepageForm, setHomepageForm] = useState(normalizeHomepageSettings(data?.homepageSettings));
  const [isCompact, setIsCompact] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 960 : false));
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [projectEditorTab, setProjectEditorTab] = useState<'content' | 'assets'>('content');
  const [projectAssets, setProjectAssets] = useState<ProjectAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [homepageAssetPickerOpen, setHomepageAssetPickerOpen] = useState(false);
  const [homepageAssetProjectId, setHomepageAssetProjectId] = useState('');
  const [homepageProjectAssets, setHomepageProjectAssets] = useState<ProjectAsset[]>([]);
  const [homepageAssetsLoading, setHomepageAssetsLoading] = useState(false);
  const [aiInstructions, setAiInstructions] = useState('');
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const blogBlockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const assetPickerResolver = useRef<((asset: ProjectAsset | null) => void) | null>(null);
  const homepageAssetPickerResolver = useRef<((asset: ProjectAsset | null) => void) | null>(null);

  const categoryName = useMemo(
    () => adminData.categories?.find((category: any) => category.id === form?.categoryId)?.name || 'Project',
    [adminData.categories, form?.categoryId],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => setIsCompact(window.innerWidth <= 960);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  async function sync() {
    setLoading(true);
    try {
      const [content, nextStats] = await Promise.all([
        api.getAdminContent(),
        api.getStats().catch(() => ({ projectCount: 0, publishedCount: 0, blogCount: 0, categoryCount: 0 })),
      ]);
      setAdminData(content);
      setStats(nextStats);
    } catch {
      api.clearToken();
      setAuthed(false);
      setAuthError('Session expired');
    } finally {
      setLoading(false);
    }
  }

  async function loadProjectAssets(projectId = selId) {
    if (!projectId) {
      setProjectAssets([]);
      return;
    }

    setAssetsLoading(true);
    try {
      const response = await api.getProjectAssets(projectId);
      setProjectAssets(response.assets || []);
    } catch (err: any) {
      alert(err.message || 'Failed to load project assets');
    } finally {
      setAssetsLoading(false);
    }
  }

  async function loadHomepageProjectAssets(projectId = homepageAssetProjectId) {
    if (!projectId) {
      setHomepageProjectAssets([]);
      return;
    }

    setHomepageAssetsLoading(true);
    try {
      const response = await api.getProjectAssets(projectId);
      setHomepageProjectAssets(response.assets || []);
    } catch (err: any) {
      alert(err.message || 'Failed to load project assets');
    } finally {
      setHomepageAssetsLoading(false);
    }
  }

  async function uploadProjectAssetFile(file: File) {
    if (!file) return null;

    if (!selId) {
      return api.uploadImage(file, form?.title, `draft-${Date.now()}`);
    }

    const response = await api.uploadProjectAsset(selId, file);
    await loadProjectAssets(selId);

    if (!response?.asset) return null;
    return {
      ...response.asset,
      url: response.asset.publicUrl,
    };
  }

  async function importProjectAssetUrl(url: string) {
    if (!selId) throw new Error('Save the project first to use the asset library');
    const response = await api.importProjectAssetUrl(selId, url);
    await loadProjectAssets(selId);
    return response?.asset || null;
  }

  async function syncCurrentProjectAssets() {
    if (!selId) return;
    setAssetsLoading(true);
    try {
      await api.syncProjectAssets(selId);
      await loadProjectAssets(selId);
    } finally {
      setAssetsLoading(false);
    }
  }

  async function archiveProjectAsset(asset: ProjectAsset) {
    if (!selId) return;
    if (!confirm(`Archive ${asset.originalFilename}?`)) return;
    await api.deleteProjectAsset(selId, asset.id);
    await loadProjectAssets(selId);
  }

  async function updateProjectAsset(asset: ProjectAsset, payload: Partial<ProjectAsset>) {
    if (!selId) return;
    const response = await api.updateProjectAsset(selId, asset.id, payload);
    if (response?.asset) {
      setProjectAssets((current) => current.map((item) => (item.id === asset.id ? response.asset : item)));
    } else {
      await loadProjectAssets(selId);
    }
  }

  function openProjectAssetPicker(): Promise<ProjectAsset | null> {
    if (!selId) return Promise.resolve(null);

    setAssetPickerOpen(true);
    return new Promise((resolve) => {
      assetPickerResolver.current = resolve;
    });
  }

  function closeProjectAssetPicker() {
    setAssetPickerOpen(false);
    assetPickerResolver.current?.(null);
    assetPickerResolver.current = null;
  }

  function handleProjectAssetPicked(asset: ProjectAsset) {
    setAssetPickerOpen(false);
    assetPickerResolver.current?.(asset);
    assetPickerResolver.current = null;
  }

  function getDefaultHomepageAssetProjectId() {
    const projects = (adminData.projects || []).filter((project: Project) => !project.deletedAt);
    if (homepageAssetProjectId && projects.some((project: Project) => project.id === homepageAssetProjectId)) {
      return homepageAssetProjectId;
    }
    return projects.find((project: Project) => project.isPublished)?.id || projects[0]?.id || '';
  }

  function openHomepageProjectAssetPicker(): Promise<ProjectAsset | null> {
    const projectId = getDefaultHomepageAssetProjectId();
    if (!projectId) return Promise.resolve(null);

    setHomepageAssetProjectId(projectId);
    setHomepageAssetPickerOpen(true);
    void loadHomepageProjectAssets(projectId);

    return new Promise((resolve) => {
      homepageAssetPickerResolver.current = resolve;
    });
  }

  function closeHomepageProjectAssetPicker() {
    setHomepageAssetPickerOpen(false);
    homepageAssetPickerResolver.current?.(null);
    homepageAssetPickerResolver.current = null;
  }

  function handleHomepageProjectAssetPicked(asset: ProjectAsset) {
    setHomepageAssetPickerOpen(false);
    homepageAssetPickerResolver.current?.(asset);
    homepageAssetPickerResolver.current = null;
  }

  useEffect(() => { if (authed) sync(); }, [authed]);

  useEffect(() => {
    if (!authed || !selId) {
      setProjectAssets([]);
      return;
    }
    void loadProjectAssets(selId);
  }, [authed, selId]);

  useEffect(() => {
    if (!data) return;
    setAdminData(data);
  }, [data]);

  useEffect(() => {
    setThemeForm(normalizeThemeSettings(adminData.themeSettings));
  }, [adminData.themeSettings]);

  useEffect(() => {
    setHomepageForm(normalizeHomepageSettings(adminData.homepageSettings));
  }, [adminData.homepageSettings]);

  useEffect(() => {
    if (tab !== 'beforeafter') return;
    const toggles: Record<string, boolean> = {};
    adminData.projects
      .filter((project: any) => parseProjectContent(project.content).some((block: any) => block.type === 'beforeAfter'))
      .forEach((project: any) => {
        toggles[project.id] = project.isPublished !== false;
      });
    setBaToggles(toggles);
  }, [adminData.projects, tab]);

  async function login(e: any) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.login(username, password);
      setAuthed(true);
      setPassword('');
      await sync();
    } catch {
      setAuthError('Wrong credentials');
      api.clearToken();
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await api.logout();
    setAuthed(false);
    setSelId('');
    setForm(null);
    setBlogSelId('');
    setBlogForm(null);
    setCatSelId('');
    setCatForm(null);
  }

  async function saveThemeSettings() {
    setSaving(true);
    try {
      const response = await api.updateThemeSettings(themeForm);
      setThemeForm(normalizeThemeSettings(response.themeSettings));
      await refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function saveHomepageSettings() {
    setSaving(true);
    try {
      const response = await api.updateHomepageSettings(homepageForm);
      setHomepageForm(normalizeHomepageSettings(response.homepageSettings));
      await refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function uploadHomepageImage(file: File, field: string) {
    setSaving(true);
    try {
      return await api.uploadImage(file, 'homepage', field);
    } catch (err: any) {
      alert(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function createTestimonial() {
    setSaving(true);
    try {
      await api.createTestimonial({
        author: 'Client',
        date: '',
        text: 'New review text',
        image: '',
        link: '',
        linkHref: '',
        projectId: '',
        projectHref: '',
        projectText: '',
        sortOrder: adminData.testimonials?.length || 0,
        isPublished: true,
      });
      await sync();
      await refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function saveTestimonial(id: string, payload: Partial<Testimonial>) {
    setSaving(true);
    try {
      await api.updateTestimonial(id, payload);
      await sync();
      await refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTestimonial(id: string) {
    if (!confirm('Delete this review?')) return;
    setSaving(true);
    try {
      await api.deleteTestimonial(id);
      await sync();
      await refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function newCategory() {
    setCatSelId('');
    setCatForm({ name: '', slug: '', description: '', showInHeader: true, sortOrder: 0 });
  }

  function editCategory(category: any) {
    setCatSelId(category.id);
    setCatForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      showInHeader: category.showInHeader,
      sortOrder: category.sortOrder || 0,
    });
  }

  function setCatF(field: string, value: any) {
    setCatForm((prev: any) => ({ ...prev, [field]: value }));
  }

  async function saveCategory(e: any) {
    e.preventDefault();
    setSaving(true);
    try {
      if (catSelId) await api.updateCategory(catSelId, catForm);
      else await api.createCategory(catForm);
      await sync();
      setCatSelId('');
      setCatForm(null);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory() {
    if (!catSelId || !confirm('Delete this category?')) return;
    setSaving(true);
    try {
      await api.deleteCategory(catSelId);
      await sync();
      setCatSelId('');
      setCatForm(null);
    } finally {
      setSaving(false);
    }
  }

  function newProject() {
    const firstCategory = adminData.categories?.[0];
    const nextProject = {
      title: '',
      slug: '',
      categoryId: firstCategory?.id || '',
      stylePreset: 'default',
      isFeatured: false,
      isPublished: true,
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      cityName: '',
      year: '',
      completedAt: '',
      deletedAt: '',
    };
    setSelId('');
    setForm({
      ...nextProject,
      content: buildProjectBaseBlocks(nextProject, firstCategory?.name || 'Project', 1),
    });
    setProjectEditorTab('content');
    setProjectAssets([]);
    setActiveBlockId('base-hero-image');
  }

  function closeProjectEditor() {
    setSelId('');
    setForm(null);
    setActiveBlockId(null);
    setProjectEditorTab('content');
    setProjectAssets([]);
  }

  function editProject(project: any) {
    const projectCategoryName = adminData.categories?.find((category: any) => category.id === project.categoryId)?.name || 'Project';
    const projectBlocks = parseProjectContent(project.content);
    setSelId(project.id);
    setForm({
      title: project.title || '',
      slug: project.slug || '',
      categoryId: project.categoryId || '',
      stylePreset: project.stylePreset || 'default',
      content: projectBlocks.length ? projectBlocks : buildProjectBaseBlocks(project, projectCategoryName, 1),
      isFeatured: !!project.isFeatured,
      isPublished: project.isPublished !== false,
      seoTitle: project.seoTitle || '',
      seoDescription: project.seoDescription || '',
      seoKeywords: project.seoKeywords || '',
      cityName: project.cityName || '',
      year: project.year || '',
      completedAt: project.completedAt || '',
      createdAt: project.createdAt || '',
      updatedAt: project.updatedAt || '',
      deletedAt: project.deletedAt || '',
    });
    setProjectEditorTab('content');
    setAiInstructions('');
    setActiveBlockId((projectBlocks[0]?.id as string) || 'base-hero-image');
  }

  function setF(field: string, value: any) {
    setForm((prev: any) => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !prev.slug) next.slug = toSlug(value);
      return next;
    });
  }

  function addBlock(type: string) {
    setForm((prev: any) => ({
      ...prev,
      content: [...(prev.content || []), { type, data: {}, id: `custom-${type}-${Date.now()}` }],
    }));
  }

  function removeBlock(index: number) {
    setForm((prev: any) => ({
      ...prev,
      content: (prev.content || []).filter((_: any, i: number) => i !== index),
    }));
  }

  function moveBlockToIndex(fromIndex: number, toIndex: number) {
    setForm((prev: any) => {
      const content = [...(prev.content || [])];
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= content.length || toIndex >= content.length) return prev;
      const [moved] = content.splice(fromIndex, 1);
      content.splice(toIndex, 0, moved);
      return { ...prev, content };
    });
  }

  function moveBlock(index: number, direction: number) {
    setForm((prev: any) => {
      const content = [...(prev.content || [])];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= content.length) return prev;
      [content[index], content[nextIndex]] = [content[nextIndex], content[index]];
      return { ...prev, content };
    });
  }

  function setBlock(index: number, field: string, value: any) {
    setForm((prev: any) => {
      const content = [...(prev.content || [])];
      content[index] = { ...content[index], data: { ...content[index].data, [field]: value } };
      return { ...prev, content };
    });
  }

  async function uploadBlockImg(blockIdx: number, field: string, file: File) {
    if (!file) return null;
    setSaving(true);
    try {
      const uploaded = await uploadProjectAssetFile(file);
      if (uploaded?.url && !field.toLowerCase().includes('upload')) setBlock(blockIdx, field, uploaded.url);
      return uploaded;
    } catch (err: any) {
      alert(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function saveProject(e: any) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, content: JSON.stringify(form.content || []) };
      if (selId) await api.updateProject(selId, payload);
      else await api.createProject(payload);
      await sync();
      await refresh();
      closeProjectEditor();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject() {
    if (!selId || !confirm('Mark this project as deleted and hide it from the public site?')) return;
    setSaving(true);
    try {
      await api.deleteProject(selId);
      await sync();
      await refresh();
      closeProjectEditor();
    } finally {
      setSaving(false);
    }
  }

  async function generateProjectDraftFromAi() {
    if (!selId) {
      alert('Save the project first, then AI can use its asset library.');
      return;
    }

    setSaving(true);
    try {
      const response = await api.generateProjectPageDraft(selId, {
        instructions: aiInstructions,
      });
      const draft = response?.draft;
      if (!draft) return;

      setForm((prev: any) => ({
        ...prev,
        content: draft.content || prev.content || [],
        seoTitle: draft.seoTitle || prev.seoTitle || '',
        seoDescription: draft.seoDescription || prev.seoDescription || '',
        seoKeywords: draft.seoKeywords || prev.seoKeywords || '',
      }));
      setProjectEditorTab('content');
      setActiveBlockId('ai-hero-image');
    } catch (err: any) {
      alert(err.message || 'AI draft failed');
    } finally {
      setSaving(false);
    }
  }

  async function generateBlockTextWithAi(context: any) {
    const prompt = window.prompt('Что нужно написать или улучшить?', context.currentValue || '');
    if (prompt === null) return null;

    const response = await api.generateAiText({
      projectId: selId || undefined,
      project: form,
      prompt,
      ...context,
    });

    return response?.text || null;
  }

  async function generateBlogBlockTextWithAi(context: any) {
    const prompt = window.prompt('What should the blog text explain or improve?', context.currentValue || '');
    if (prompt === null) return null;

    const response = await api.generateAiText({
      project: blogForm,
      prompt,
      ...context,
    });

    return response?.text || null;
  }

  function applyBaseStructure() {
    setForm((prev: any) => ({
      ...prev,
      content: buildProjectBaseBlocks(prev, categoryName, 1),
    }));
    setActiveBlockId('base-hero-image');
  }

  async function applyBaseStructureToAllProjects() {
    if (!confirm('Apply the base project structure to all projects? This will replace current block layouts.')) return;
    setSaving(true);
    try {
      for (const project of adminData.projects || []) {
        const nextCategoryName = adminData.categories?.find((category: any) => category.id === project.categoryId)?.name || 'Project';
        await api.updateProject(project.id, {
          title: project.title,
          slug: project.slug,
          categoryId: project.categoryId,
          isFeatured: !!project.isFeatured,
          isPublished: project.isPublished !== false,
          stylePreset: project.stylePreset || 'default',
          seoTitle: project.seoTitle || '',
          seoDescription: project.seoDescription || '',
        seoKeywords: project.seoKeywords || '',
        cityName: project.cityName || '',
        year: project.year || '',
        completedAt: project.completedAt || '',
        content: JSON.stringify(buildProjectBaseBlocks(project, nextCategoryName, 1)),
      });
      }
      await sync();
      await refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function newBlog() {
    const nextForm = {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImage: '',
      isPublished: false,
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      tags: '',
    };
    setBlogSelId('');
    setBlogForm(nextForm);
    setBlogBlocks(buildBlogBaseBlocks(nextForm));
    setBlogArticleSections([
      { title: 'Main idea', text: '' },
      { title: 'What to consider', text: '' },
      { title: 'Designer note', text: '' },
    ]);
    setActiveBlogBlockId('blog-hero');
  }

  function editBlog(post: any) {
    const nextBlocks = parseBlogPostBlocks(post);
    const nextArticleSections = parseBlogArticleSections(post.content);
    setBlogSelId(post.id);
    setBlogForm({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      coverImage: post.coverImage || '',
      isPublished: !!post.isPublished,
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      seoKeywords: post.seoKeywords || '',
      tags: post.tags || '',
    });
    setBlogBlocks(nextBlocks.length ? nextBlocks : buildBlogBaseBlocks(post));
    setBlogArticleSections(nextArticleSections.length ? nextArticleSections : [
      { title: 'Main idea', text: post.excerpt || '' },
      { title: 'What to consider', text: '' },
      { title: 'Designer note', text: '' },
    ]);
    setActiveBlogBlockId((nextBlocks[0]?.id as string) || 'blog-hero');
  }

  function setBF(field: string, value: any) {
    setBlogForm((prev: any) => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !prev.slug) next.slug = toSlug(value);
      return next;
    });
  }

  async function saveBlog(e: any) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...blogForm,
        coverImage: blogForm.coverImage || getBlogBlocksCover(blogBlocks),
        content: JSON.stringify({
          blocks: blogBlocks || [],
          article: blogArticleSections.filter((section) => section.title || section.text),
        }),
      };
      if (blogSelId) await api.updateBlog(blogSelId, payload);
      else await api.createBlog(payload);
      await sync();
      newBlog();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlog() {
    if (!blogSelId || !confirm('Delete this post?')) return;
    setSaving(true);
    try {
      await api.deleteBlog(blogSelId);
      await sync();
      newBlog();
    } finally {
      setSaving(false);
    }
  }

  function addBlogBlock(type: string) {
    setBlogBlocks((prev: any[]) => [...(prev || []), { type, data: {}, id: `blog-${type}-${Date.now()}` }]);
  }

  function removeBlogBlock(index: number) {
    setBlogBlocks((prev: any[]) => (prev || []).filter((_: any, i: number) => i !== index));
  }

  function moveBlogBlock(index: number, direction: number) {
    setBlogBlocks((prev: any[]) => {
      const content = [...(prev || [])];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= content.length) return prev;
      [content[index], content[nextIndex]] = [content[nextIndex], content[index]];
      return content;
    });
  }

  function moveBlogBlockToIndex(fromIndex: number, toIndex: number) {
    setBlogBlocks((prev: any[]) => {
      const content = [...(prev || [])];
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= content.length || toIndex >= content.length) return prev;
      const [moved] = content.splice(fromIndex, 1);
      content.splice(toIndex, 0, moved);
      return content;
    });
  }

  function setBlogBlock(index: number, field: string, value: any) {
    setBlogBlocks((prev: any[]) => {
      const content = [...(prev || [])];
      content[index] = { ...content[index], data: { ...content[index].data, [field]: value } };
      return content;
    });
  }

  function setBlogArticleSection(index: number, field: string, value: string) {
    setBlogArticleSections((prev: any[]) => {
      const next = [...(prev || [])];
      next[index] = { ...(next[index] || { title: '', text: '' }), [field]: value };
      return next;
    });
  }

  function addBlogArticleSection() {
    setBlogArticleSections((prev: any[]) => [...(prev || []), { title: '', text: '' }]);
  }

  function removeBlogArticleSection(index: number) {
    setBlogArticleSections((prev: any[]) => (prev || []).filter((_: any, i: number) => i !== index));
  }

  async function uploadBlogBlockImg(_blockIdx: number, field: string, file: File) {
    if (!file) return null;
    setSaving(true);
    try {
      return await api.uploadImage(file, `${blogForm?.title || 'blog'}-${field}`);
    } catch (err: any) {
      alert(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  }

  function applyBlogBaseStructure() {
    const nextBlocks = buildBlogBaseBlocks(blogForm || {});
    setBlogBlocks(nextBlocks);
    setActiveBlogBlockId((nextBlocks[0]?.id as string) || 'blog-hero');
  }

  function scrollToBlogBlockEditor(blockId: string) {
    setActiveBlogBlockId(blockId);
    window.setTimeout(() => {
      blogBlockRefs.current[blockId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 10);
  }

  async function saveBaToggles() {
    setSaving(true);
    try {
      for (const [projectId, isPublished] of Object.entries(baToggles)) {
        await api.updateProject(projectId, { isPublished });
      }
      await sync();
      alert('Before & After settings saved');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function getCover(project: any) {
    return getHeroImage(parseProjectContent(project.content));
  }

  function scrollToBlockEditor(blockId: string) {
    setActiveBlockId(blockId);
    window.setTimeout(() => {
      blockRefs.current[blockId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 10);
  }

  if (!authed) {
    return (
      <main className="container" style={{ padding: '120px 15px 60px', maxWidth: '460px' }}>
        <h1 style={{ color: '#fff', fontFamily: "'GilroyExtraBold', sans-serif", textAlign: 'center', marginBottom: '30px' }}>Admin Login</h1>
        <form onSubmit={login} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '30px', display: 'grid', gap: '15px' }}>
          <label style={{ display: 'grid', gap: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          </label>
          {authError ? <p style={{ color: '#e74c3c', fontSize: '13px', margin: 0 }}>{authError}</p> : null}
          <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%' }}>
            {saving ? 'Signing in...' : 'Sign in'}
          </button>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'center', margin: 0 }}>Default: admin / admin123</p>
        </form>
      </main>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'home', label: 'Home' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'projects', label: 'Projects' },
    { id: 'categories', label: 'Categories' },
    { id: 'beforeafter', label: 'Before & After' },
    { id: 'themes', label: 'Themes' },
    { id: 'blog', label: 'Blog' },
  ];

  return (
    <main className="container" style={{ padding: isCompact ? '92px 0 40px' : '100px 15px 60px', maxWidth: '1400px' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#141414', paddingBottom: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {tabs.map((nextTab) => (
              <button
                key={nextTab.id}
                onClick={() => setTab(nextTab.id)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: tab === nextTab.id ? '1px solid rgba(198,164,123,1)' : '1px solid rgba(255,255,255,0.15)',
                  background: tab === nextTab.id ? 'rgba(198,164,123,0.15)' : 'transparent',
                  color: tab === nextTab.id ? 'rgba(198,164,123,1)' : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  fontWeight: tab === nextTab.id ? 600 : 400,
                }}
              >
                {nextTab.label}
              </button>
            ))}
          </div>
          <button onClick={logout} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px' }}>Logout</button>
        </div>
      </div>

      {tab === 'dashboard' ? (
        <div>
          <h2 style={{ color: '#fff', marginBottom: '20px' }}>Dashboard</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            {[{ l: 'Total Projects', v: stats.projectCount, c: '#8c6a4e' }, { l: 'Published', v: stats.publishedCount, c: '#27ae60' }, { l: 'Blog Posts', v: stats.blogCount, c: '#3498db' }, { l: 'Categories', v: stats.categoryCount, c: '#9b59b6' }].map((item, index) => (
              <div key={index} style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 800, color: item.c, fontFamily: "'GilroyExtraBold', sans-serif" }}>{item.v}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '5px' }}>{item.l}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'home' ? (
        <HomeSettingsEditor
          value={homepageForm}
          onChange={setHomepageForm}
          onSave={saveHomepageSettings}
          onUpload={uploadHomepageImage}
          onPickProjectAsset={openHomepageProjectAssetPicker}
          saving={saving}
          isCompact={isCompact}
        />
      ) : null}

      {tab === 'testimonials' ? (
        <TestimonialsEditor
          testimonials={adminData.testimonials || []}
          projects={adminData.projects || []}
          onCreate={createTestimonial}
          onSave={saveTestimonial}
          onDelete={deleteTestimonial}
          onUpload={uploadHomepageImage}
          saving={saving}
          isCompact={isCompact}
        />
      ) : null}

      {tab === 'projects' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '18px' }}>{form ? 'Editing Project' : 'Projects'}</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {form ? (
                <button onClick={closeProjectEditor} style={{ ...miniBtn, padding: '8px 16px', background: 'rgba(255,255,255,0.1)' }}>
                  Back to List
                </button>
              ) : null}
              {!form ? (
                <button onClick={applyBaseStructureToAllProjects} style={{ ...miniBtn, padding: '8px 16px', borderColor: 'rgba(198,164,123,0.45)', color: 'rgba(198,164,123,1)' }}>
                  Fill All Structures
                </button>
              ) : null}
              {!form ? <button onClick={newProject} className="btn-primary">+ New Project</button> : null}
            </div>
          </div>

          {!form ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', marginBottom: '30px' }}>
              {adminData.projects?.map((project: any) => (
                <div
                  key={project.id}
                  onClick={() => editProject(project)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {getCover(project) ? <img src={getCover(project)} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{project.cityName || ''} {project.completedAt || project.year ? `(${project.completedAt || project.year})` : ''}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: project.isPublished ? 'rgba(39,174,96,0.2)' : 'rgba(231,76,60,0.2)', color: project.isPublished ? '#27ae60' : '#e74c3c' }}>{project.isPublished ? 'Published' : 'Draft'}</span>
                      {project.isFeatured ? <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(140,106,78,0.2)', color: '#8c6a4e' }}>Featured</span> : null}
                      {project.deletedAt ? <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(231,76,60,0.18)', color: '#ff8a80' }}>Deleted</span> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ ...cardStyle, maxHeight: isCompact ? 'none' : '80vh', overflow: isCompact ? 'visible' : 'auto' }}>
              <h3 style={{ color: '#fff', margin: '0 0 15px', fontSize: '16px' }}>{selId ? 'Edit Project' : 'New Project'}</h3>
              <form onSubmit={saveProject} style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <label style={labelStyle}>Title<input value={form.title} onChange={(e) => setF('title', e.target.value)} required style={inputStyle} /></label>
                  <label style={labelStyle}>Slug<input value={form.slug} onChange={(e) => setF('slug', e.target.value)} style={inputStyle} placeholder="auto-generated" /></label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '1fr 1fr 1fr', gap: '12px' }}>
                  <label style={labelStyle}>Category<select value={form.categoryId} onChange={(e) => setF('categoryId', e.target.value)} required style={inputStyle}>{adminData.categories?.map((category: any) => <option key={category.id} value={category.id} style={{ background: '#141414' }}>{category.name}</option>)}</select></label>
                  <label style={labelStyle}>City<input value={form.cityName} onChange={(e) => setF('cityName', e.target.value)} placeholder="San Francisco" style={inputStyle} /></label>
                  <label style={labelStyle}>Year<input type="number" value={form.year} onChange={(e) => setF('year', e.target.value)} placeholder="2024" style={inputStyle} /></label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '1fr 1fr 1fr', gap: '12px' }}>
                  <label style={labelStyle}>Project realized<input value={form.completedAt || ''} onChange={(e) => setF('completedAt', e.target.value)} placeholder="2020 or Spring 2020" style={inputStyle} /></label>
                  <label style={labelStyle}>Created in DB<input value={form.createdAt || ''} readOnly style={{ ...inputStyle, opacity: 0.65 }} /></label>
                  <label style={labelStyle}>Updated in DB<input value={form.updatedAt || ''} readOnly style={{ ...inputStyle, opacity: 0.65 }} /></label>
                </div>
                {form.deletedAt ? (
                  <label style={labelStyle}>Deleted in DB<input value={form.deletedAt} readOnly style={{ ...inputStyle, opacity: 0.65, color: '#ff8a80' }} /></label>
                ) : null}
                <label style={labelStyle}>
                  Style Preset
                  <select value={form.stylePreset || 'default'} onChange={(e) => setF('stylePreset', e.target.value)} style={inputStyle}>
                    {PROJECT_STYLE_PRESET_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} style={{ background: '#141414' }}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px' }}><input type="checkbox" checked={form.isFeatured} onChange={(e) => setF('isFeatured', e.target.checked)} /> Featured</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px' }}><input type="checkbox" checked={form.isPublished} onChange={(e) => setF('isPublished', e.target.checked)} /> Published</label>
                </div>

                <details style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px' }}>
                  <summary style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600 }}>SEO Settings</summary>
                  <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
                    <label style={labelStyle}>SEO Title<input value={form.seoTitle} onChange={(e) => setF('seoTitle', e.target.value)} style={inputStyle} /></label>
                    <label style={labelStyle}>SEO Description<textarea rows={2} value={form.seoDescription} onChange={(e) => setF('seoDescription', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></label>
                    <label style={labelStyle}>Keywords<input value={form.seoKeywords} onChange={(e) => setF('seoKeywords', e.target.value)} placeholder="interior, kitchen, SF" style={inputStyle} /></label>
                  </div>
                </details>

                <div style={{ ...panelStyle, gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>AI block draft</div>
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '3px' }}>Creates editable blocks from project data and active assets, then fills copy and SEO.</div>
                    </div>
                    <button type="button" onClick={generateProjectDraftFromAi} disabled={saving || !selId} style={actionButtonStyle(true)}>
                      Generate block draft
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={aiInstructions}
                    onChange={(event) => setAiInstructions(event.target.value)}
                    placeholder="Example: make it warmer, focus on premium materials and practical storage"
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setProjectEditorTab('content')}
                    style={{
                      ...miniBtn,
                      padding: '8px 16px',
                      borderColor: projectEditorTab === 'content' ? 'rgba(198,164,123,0.45)' : 'rgba(255,255,255,0.15)',
                      color: projectEditorTab === 'content' ? 'rgba(198,164,123,1)' : 'rgba(255,255,255,0.7)',
                      background: projectEditorTab === 'content' ? 'rgba(198,164,123,0.12)' : 'transparent',
                    }}
                  >
                    Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectEditorTab('assets')}
                    style={{
                      ...miniBtn,
                      padding: '8px 16px',
                      borderColor: projectEditorTab === 'assets' ? 'rgba(198,164,123,0.45)' : 'rgba(255,255,255,0.15)',
                      color: projectEditorTab === 'assets' ? 'rgba(198,164,123,1)' : 'rgba(255,255,255,0.7)',
                      background: projectEditorTab === 'assets' ? 'rgba(198,164,123,0.12)' : 'transparent',
                    }}
                  >
                    Assets
                  </button>
                </div>

                {projectEditorTab === 'assets' ? (
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
                    <ProjectAssetLibrary
                      projectId={selId || undefined}
                      projectSlug={form.slug}
                      projectTitle={form.title}
                      assets={projectAssets}
                      loading={assetsLoading}
                      onRefresh={() => loadProjectAssets(selId)}
                      onSync={syncCurrentProjectAssets}
                      onUpload={async (file) => {
                        try {
                          await uploadProjectAssetFile(file);
                        } catch (err: any) {
                          alert(err.message);
                        }
                      }}
                      onImportUrl={async (url) => {
                        try {
                          await importProjectAssetUrl(url);
                        } catch (err: any) {
                          alert(err.message);
                        }
                      }}
                      onUpdate={async (asset, payload) => {
                        try {
                          await updateProjectAsset(asset, payload);
                        } catch (err: any) {
                          alert(err.message);
                        }
                      }}
                      onDelete={async (asset) => {
                        try {
                          await archiveProjectAsset(asset);
                        } catch (err: any) {
                          alert(err.message);
                        }
                      }}
                    />
                  </div>
                ) : (
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <h4 style={{ color: '#fff', margin: 0, fontSize: '14px' }}>Content Blocks</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button type="button" onClick={applyBaseStructure} style={{ ...miniBtn, borderColor: 'rgba(198,164,123,0.45)', color: 'rgba(198,164,123,1)' }}>
                        Apply Base Structure
                      </button>
                    </div>
                  </div>
                  <AdminProjectMiniMap
                    blocks={form.content || []}
                    activeBlockId={activeBlockId}
                    onSelect={scrollToBlockEditor}
                    onReorder={moveBlockToIndex}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                    {BLOCK_TYPES.map((blockType) => (
                      <button key={blockType.value} type="button" onClick={() => addBlock(blockType.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '11px' }}>
                        {blockType.label}
                      </button>
                    ))}
                  </div>
                  {(form.content || []).map((block: any, index: number) => (
                    <div
                      key={block.id || index}
                      onClick={() => setActiveBlockId(block.id || `${block.type}-${index}`)}
                      ref={(node) => {
                        blockRefs.current[block.id || `${block.type}-${index}`] = node;
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: activeBlockId === (block.id || `${block.type}-${index}`) ? '1px solid rgba(198,164,123,0.45)' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '10px',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>{block.type}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} style={miniBtn}>↑</button>
                          <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === (form.content || []).length - 1} style={miniBtn}>↓</button>
                          <button type="button" onClick={() => removeBlock(index)} style={{ ...miniBtn, color: '#e74c3c' }}>✕</button>
                        </div>
                      </div>
                      <BlockEditor
                        block={block}
                        idx={index}
                        onUpdate={setBlock}
                        onUpload={uploadBlockImg}
                        onPickAsset={selId ? async () => {
                          const asset = await openProjectAssetPicker();
                          return asset ? { ...asset, url: asset.publicUrl } : null;
                        } : undefined}
                        onGenerateText={generateBlockTextWithAi}
                        formTitle={form.title}
                        compact={isCompact}
                      />
                    </div>
                  ))}
                  {(!form.content || !form.content.length) ? <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '15px', margin: 0 }}>Click a block type above to start building</p> : null}
                </div>
                )}

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save Project'}</button>
                  {selId ? <button type="button" onClick={deleteProject} style={{ ...miniBtn, padding: '10px 20px', background: '#e74c3c', border: 'none' }}>Mark Deleted</button> : null}
                </div>
              </form>
            </div>
          )}
        </div>
      ) : null}

      {tab === 'blog' ? (
        <div style={{ display: 'grid', gridTemplateColumns: blogSelId && !isCompact ? '300px 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
          <div style={{ ...cardStyle, maxHeight: isCompact ? 'none' : '80vh', overflow: isCompact ? 'visible' : 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>Blog Posts</h3>
              <button onClick={newBlog} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>+ New</button>
            </div>
            {adminData.blogPosts?.map((post: any) => (
              <div key={post.id} onClick={() => editBlog(post)} style={{ display: 'grid', gridTemplateColumns: '58px 1fr', gap: '10px', alignItems: 'center', padding: '10px', borderRadius: '10px', cursor: 'pointer', background: blogSelId === post.id ? 'rgba(198,164,123,0.15)' : 'transparent', marginBottom: '6px' }}>
                <div style={{ width: '58px', aspectRatio: '4 / 3', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {post.coverImage ? <img src={post.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}
                </div>
                <div>
                  <div style={{ color: '#fff', fontSize: '13px', lineHeight: 1.25 }}>{post.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '4px' }}>{post.isPublished ? 'Published' : 'Draft'}{post.coverImage ? ' · cover' : ' · no cover'}</div>
                </div>
              </div>
            ))}
          </div>
          {blogForm ? (
            <div style={{ ...cardStyle, maxHeight: isCompact ? 'none' : '80vh', overflow: isCompact ? 'visible' : 'auto' }}>
              <h3 style={{ color: '#fff', margin: '0 0 15px', fontSize: '16px' }}>{blogSelId ? 'Edit Post' : 'New Post'}</h3>
              <form onSubmit={saveBlog} style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <label style={labelStyle}>Title<input value={blogForm.title} onChange={(e) => setBF('title', e.target.value)} required style={inputStyle} /></label>
                  <label style={labelStyle}>Slug<input value={blogForm.slug} onChange={(e) => setBF('slug', e.target.value)} style={inputStyle} placeholder="auto" /></label>
                </div>
                <label style={labelStyle}>Excerpt<textarea rows={2} value={blogForm.excerpt} onChange={(e) => setBF('excerpt', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></label>

                <div style={{ display: 'grid', gap: '8px' }}>
                  <div>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>Preview image</div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '3px' }}>Used on the blog card and article hero.</div>
                  </div>
                  <BasicCoverFieldEditor
                    url={blogForm.coverImage}
                    crop={ensureCrop()}
                    aspectRatio="16 / 10"
                    cropEnabled={false}
                    onUrlChange={(next) => setBF('coverImage', next)}
                    onCropChange={() => {}}
                    onUpload={async (file) => {
                      setSaving(true);
                      try {
                        return await api.uploadImage(file, blogForm.title);
                      } catch (err: any) {
                        alert(err.message);
                        return null;
                      } finally {
                        setSaving(false);
                      }
                    }}
                  />
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <div>
                      <h4 style={{ color: '#fff', margin: 0, fontSize: '14px' }}>Article Blocks</h4>
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '3px' }}>Same visual block system as project pages.</div>
                    </div>
                    <button type="button" onClick={applyBlogBaseStructure} style={{ ...miniBtn, borderColor: 'rgba(198,164,123,0.45)', color: 'rgba(198,164,123,1)' }}>
                      Apply Base Structure
                    </button>
                  </div>
                  <AdminProjectMiniMap
                    blocks={blogBlocks || []}
                    activeBlockId={activeBlogBlockId}
                    onSelect={scrollToBlogBlockEditor}
                    onReorder={moveBlogBlockToIndex}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                    {BLOCK_TYPES.filter((blockType) => blockType.value !== 'metaInfo' && blockType.value !== 'beforeAfter').map((blockType) => (
                      <button key={blockType.value} type="button" onClick={() => addBlogBlock(blockType.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '11px' }}>
                        {blockType.label}
                      </button>
                    ))}
                  </div>
                  {(blogBlocks || []).map((block: any, index: number) => (
                    <div
                      key={block.id || index}
                      onClick={() => setActiveBlogBlockId(block.id || `${block.type}-${index}`)}
                      ref={(node) => {
                        blogBlockRefs.current[block.id || `${block.type}-${index}`] = node;
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: activeBlogBlockId === (block.id || `${block.type}-${index}`) ? '1px solid rgba(198,164,123,0.45)' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '10px',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>{block.type}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button type="button" onClick={() => moveBlogBlock(index, -1)} disabled={index === 0} style={miniBtn}>up</button>
                          <button type="button" onClick={() => moveBlogBlock(index, 1)} disabled={index === (blogBlocks || []).length - 1} style={miniBtn}>down</button>
                          <button type="button" onClick={() => removeBlogBlock(index)} style={{ ...miniBtn, color: '#e74c3c' }}>x</button>
                        </div>
                      </div>
                      <BlockEditor
                        block={block}
                        idx={index}
                        onUpdate={setBlogBlock}
                        onUpload={uploadBlogBlockImg}
                        onGenerateText={generateBlogBlockTextWithAi}
                        formTitle={blogForm.title}
                        compact={isCompact}
                      />
                    </div>
                  ))}
                  {(!blogBlocks || !blogBlocks.length) ? <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '15px', margin: 0 }}>Click a block type above to start building</p> : null}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <div>
                      <h4 style={{ color: '#fff', margin: 0, fontSize: '14px' }}>Article Text</h4>
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '3px' }}>Main readable article body. Visual blocks above are only for presentation.</div>
                    </div>
                    <button type="button" onClick={addBlogArticleSection} style={miniBtn}>+ Section</button>
                  </div>
                  {(blogArticleSections || []).map((section: any, sectionIndex: number) => (
                    <div key={sectionIndex} style={{ ...panelStyle, marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>Section {sectionIndex + 1}</span>
                        <button type="button" onClick={() => removeBlogArticleSection(sectionIndex)} style={{ ...miniBtn, color: '#e74c3c' }}>x</button>
                      </div>
                      <label style={labelStyle}>Heading<input value={section.title || ''} onChange={(event) => setBlogArticleSection(sectionIndex, 'title', event.target.value)} style={inputStyle} /></label>
                      <label style={labelStyle}>Text<textarea rows={6} value={section.text || ''} onChange={(event) => setBlogArticleSection(sectionIndex, 'text', event.target.value)} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} /></label>
                    </div>
                  ))}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px' }}><input type="checkbox" checked={blogForm.isPublished} onChange={(e) => setBF('isPublished', e.target.checked)} /> Published</label>

                <details style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px' }}>
                  <summary style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>SEO</summary>
                  <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
                    <label style={labelStyle}>SEO Title<input value={blogForm.seoTitle} onChange={(e) => setBF('seoTitle', e.target.value)} style={inputStyle} /></label>
                    <label style={labelStyle}>SEO Description<textarea rows={2} value={blogForm.seoDescription} onChange={(e) => setBF('seoDescription', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></label>
                    <label style={labelStyle}>Tags<input value={blogForm.tags} onChange={(e) => setBF('tags', e.target.value)} placeholder="kitchen, design" style={inputStyle} /></label>
                  </div>
                </details>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save Post'}</button>
                  {blogSelId ? <button type="button" onClick={deleteBlog} style={{ ...miniBtn, padding: '10px 20px', background: '#e74c3c', border: 'none' }}>Delete</button> : null}
                </div>
              </form>
            </div>
          ) : <div style={{ ...cardStyle, textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '60px' }}><p>Select a post or click + New</p></div>}
        </div>
      ) : null}

      {tab === 'categories' ? (
        <div style={{ display: 'grid', gridTemplateColumns: catForm && !isCompact ? '300px 1fr' : '1fr', gap: '20px' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>Categories</h3>
              <button onClick={newCategory} style={miniBtn}>+ New</button>
            </div>
            {adminData.categories?.map((category: any) => (
              <div key={category.id} onClick={() => editCategory(category)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: '8px', cursor: 'pointer', background: catSelId === category.id ? 'rgba(198,164,123,0.15)' : 'transparent', marginBottom: '4px' }}>
                <div><div style={{ color: '#fff', fontSize: '14px' }}>{category.name}</div><div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>/{category.slug}</div></div>
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: category.showInHeader ? 'rgba(39,174,96,0.2)' : 'rgba(255,255,255,0.1)', color: category.showInHeader ? '#27ae60' : 'rgba(255,255,255,0.4)' }}>{category.showInHeader ? 'Visible' : 'Hidden'}</span>
              </div>
            ))}
          </div>
          {catForm ? (
            <div style={cardStyle}>
              <h3 style={{ color: '#fff', margin: '0 0 15px', fontSize: '16px' }}>{catSelId ? 'Edit Category' : 'New Category'}</h3>
              <form onSubmit={saveCategory} style={{ display: 'grid', gap: '12px' }}>
                <label style={labelStyle}>Name<input value={catForm.name} onChange={(e) => setCatF('name', e.target.value)} required style={inputStyle} /></label>
                <label style={labelStyle}>Slug<input value={catForm.slug} onChange={(e) => setCatF('slug', e.target.value)} style={inputStyle} placeholder="auto-generated" /></label>
                <label style={labelStyle}>Description<textarea rows={2} value={catForm.description} onChange={(e) => setCatF('description', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px' }}><input type="checkbox" checked={catForm.showInHeader} onChange={(e) => setCatF('showInHeader', e.target.checked)} /> Show in header</label>
                <label style={labelStyle}>Sort Order<input type="number" value={catForm.sortOrder} onChange={(e) => setCatF('sortOrder', Number(e.target.value))} style={inputStyle} /></label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save'}</button>
                  {catSelId ? <button type="button" onClick={deleteCategory} style={{ ...miniBtn, padding: '8px 16px', background: '#e74c3c', border: 'none' }}>Delete</button> : null}
                </div>
              </form>
            </div>
          ) : <div style={{ ...cardStyle, textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px' }}><p>Select a category or click + New</p></div>}
        </div>
      ) : null}

      {tab === 'beforeafter' ? (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ color: '#fff', margin: '0 0 5px', fontSize: '16px' }}>Before & After Projects</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '13px' }}>Toggle which projects appear on the Before & After page</p>
            </div>
            <button onClick={saveBaToggles} className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
          </div>
          {adminData.projects.filter((project: any) => parseProjectContent(project.content).some((block: any) => block.type === 'beforeAfter')).length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {adminData.projects
                .filter((project: any) => parseProjectContent(project.content).some((block: any) => block.type === 'beforeAfter'))
                .map((project: any) => (
                  <div key={project.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}>
                      <input type="checkbox" checked={baToggles[project.id] !== false} onChange={(e) => setBaToggles((prev) => ({ ...prev, [project.id]: e.target.checked }))} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: '#fff', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.title}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{adminData.categories?.find((category: any) => category.id === project.categoryId)?.name || ''}</div>
                      </div>
                    </label>
                  </div>
                ))}
            </div>
          ) : <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px' }}>No projects with Before/After blocks found.</p>}
        </div>
      ) : null}

      {tab === 'themes' ? (
        <AdminThemeEditor
          value={themeForm}
          saving={saving}
          onChange={setThemeForm}
          onSave={saveThemeSettings}
        />
      ) : null}

      <ProjectAssetPicker
        open={assetPickerOpen}
        assets={projectAssets}
        loading={assetsLoading}
        onClose={closeProjectAssetPicker}
        onSelect={handleProjectAssetPicked}
        onRefresh={() => loadProjectAssets(selId)}
        onUpload={async (file) => {
          try {
            await uploadProjectAssetFile(file);
          } catch (err: any) {
            alert(err.message);
          }
        }}
        onImportUrl={async (url) => {
          try {
            await importProjectAssetUrl(url);
          } catch (err: any) {
            alert(err.message);
          }
        }}
      />

      <HomepageProjectAssetPicker
        open={homepageAssetPickerOpen}
        projects={(adminData.projects || []).filter((project: Project) => !project.deletedAt)}
        selectedProjectId={homepageAssetProjectId}
        assets={homepageProjectAssets}
        loading={homepageAssetsLoading}
        onProjectChange={(projectId) => {
          setHomepageAssetProjectId(projectId);
          void loadHomepageProjectAssets(projectId);
        }}
        onClose={closeHomepageProjectAssetPicker}
        onSelect={handleHomepageProjectAssetPicked}
        onRefresh={() => void loadHomepageProjectAssets(homepageAssetProjectId)}
      />

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>Loading...</div> : null}
    </main>
  );
}

function BlockEditor({
  block,
  idx,
  onUpdate,
  onUpload,
  onPickAsset,
  onGenerateText,
  formTitle,
  compact = false,
}: {
  block: any;
  idx: number;
  onUpdate: (i: number, f: string, v: any) => void;
  onUpload: (i: number, f: string, file: File) => Promise<any> | any;
  onPickAsset?: () => Promise<any> | any;
  onGenerateText?: (context: any) => Promise<string | null>;
  formTitle: string;
  compact?: boolean;
}) {
  const { data } = block;

  const field = (label: string, fieldName: string, opts: any = {}) => (
    <label style={labelStyle}>
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <span>{label}</span>
        {opts.ai && onGenerateText ? (
          <button
            type="button"
            title="Generate with AI"
            onClick={async (event) => {
              event.preventDefault();
              event.stopPropagation();
              const nextText = await onGenerateText({
                blockType: block.type,
                fieldName,
                currentValue: data[fieldName] || '',
              });
              if (nextText !== null) onUpdate(idx, fieldName, nextText);
            }}
            style={{ ...miniBtn, padding: '3px 8px', fontSize: '10px', borderColor: 'rgba(198,164,123,0.45)', color: 'rgba(198,164,123,1)' }}
          >
            AI
          </button>
        ) : null}
      </span>
      {opts.textarea ? (
        <textarea
          rows={opts.rows || 3}
          value={data[fieldName] || ''}
          onChange={(e) => onUpdate(idx, fieldName, e.target.value)}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: opts.mono ? 'monospace' : 'inherit' }}
        />
      ) : opts.select ? (
        <select value={data[fieldName] || opts.default || ''} onChange={(e) => onUpdate(idx, fieldName, e.target.value)} style={inputStyle}>
          {opts.options.map((option: any) => <option key={option.value} value={option.value} style={{ background: '#141414' }}>{option.label}</option>)}
        </select>
      ) : (
        <input type={opts.type || 'text'} value={data[fieldName] || ''} onChange={(e) => onUpdate(idx, fieldName, e.target.value)} style={inputStyle} />
      )}
    </label>
  );

  const metaInfoValue = data.metaText || (data.items || []).map((item: any) => `${item.label}: ${item.value}`).join('\n');

  if (block.type === 'heroImage') return (
    <>
      {field('Title', 'title', { ai: true })}
      {field('Subtitle', 'subtitle', { ai: true })}
      {field('Hero Variant', 'variant', { select: true, options: [{ value: 'standard', label: 'Standard' }, { value: 'immersive', label: 'Fullscreen / transparent header' }], default: 'standard' })}
      {field('Alt Text', 'alt')}
      <BasicCoverFieldEditor
        url={data.image}
        crop={data.crop}
        assetId={data.assetId}
        aspectRatio="16 / 10"
        onUrlChange={(next) => onUpdate(idx, 'image', next)}
        onCropChange={(next) => onUpdate(idx, 'crop', next)}
        onAssetIdChange={(next) => onUpdate(idx, 'assetId', next)}
        onUpload={(file) => onUpload(idx, 'image', file)}
        onPickAsset={onPickAsset}
      />
    </>
  );

  if (block.type === 'imageGrid') return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(2, minmax(0, 1fr))' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '8px' }}>
        {Array.from({ length: Math.max(((data.images || []) as any[]).length + 1, 4) }, (_, imageIndex) => toEditableImage((data.images || [])[imageIndex])).map((image, imageIndex) => (
          <EditableCoverFieldEditor
            key={imageIndex}
            value={image}
            aspectRatio="4 / 3"
            cropEnabled={false}
            previewMaxWidth="100%"
            onChange={(nextImage) => {
              const next = Array.from(
                { length: Math.max(((data.images || []) as any[]).length + 1, imageIndex + 1) },
                (_, nextIndex) => toEditableImage((data.images || [])[nextIndex]),
              );
              next[imageIndex] = { ...nextImage, alt: nextImage.alt || formTitle };
              onUpdate(idx, 'images', next.filter((item) => item.url).map((item) => ({ url: item.url, alt: item.alt || formTitle, crop: item.crop, assetId: item.assetId || '' })));
            }}
            onUpload={(file) => onUpload(idx, `imageGridUpload-${imageIndex}`, file)}
            onPickAsset={onPickAsset}
          />
        ))}
      </div>
      {field('Columns', 'columns', { select: true, options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }], default: 2 })}
    </>
  );

  if (block.type === 'metaInfo') return (
    <label style={labelStyle}>
      Items (label: value, one per line)
      <textarea
        rows={4}
        value={metaInfoValue}
        onChange={(e) => {
          const nextText = e.target.value;
          const nextItems = nextText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const [label, ...rest] = line.split(':');
              return { label: (label || '').trim(), value: rest.join(':').trim() };
            })
            .filter((item) => item.label && item.value);
          onUpdate(idx, 'metaText', nextText);
          onUpdate(idx, 'items', nextItems);
        }}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
    </label>
  );
  if (block.type === 'typography') return <>{field('Title', 'title', { ai: true })}{field('Content', 'content', { textarea: true, rows: 5, ai: true })}{field('Size', 'size', { select: true, options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }], default: 'md' })}</>;
  if (block.type === 'sideBySide') return (
    <>
      {field('Title', 'title', { ai: true })}
      {field('Text', 'text', { textarea: true, rows: 4, ai: true })}
      {field('Position', 'imagePosition', { select: true, options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }], default: 'left' })}
      <BasicCoverFieldEditor
        url={data.image}
        crop={data.crop}
        assetId={data.assetId}
        aspectRatio="4 / 5"
        onUrlChange={(next) => onUpdate(idx, 'image', next)}
        onCropChange={(next) => onUpdate(idx, 'crop', next)}
        onAssetIdChange={(next) => onUpdate(idx, 'assetId', next)}
        onUpload={(file) => onUpload(idx, 'image', file)}
        onPickAsset={onPickAsset}
      />
    </>
  );
  if (block.type === 'ctaSection') return <>{field('Title', 'title', { ai: true })}{field('Text', 'text', { textarea: true, ai: true })}{field('Button Text', 'buttonText')}{field('Button Link', 'buttonLink')}</>;
  if (block.type === 'beforeAfter') return (
    <>
      {field('Title', 'title', { ai: true })}
      <div style={{ ...panelStyle, gap: '14px' }}>
        <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Before image</div>
        <BasicCoverFieldEditor
          url={data.beforeImage}
          crop={data.beforeCrop}
          assetId={data.beforeAssetId}
          aspectRatio="16 / 9"
          openCropOnPortraitUpload
          onUrlChange={(next) => onUpdate(idx, 'beforeImage', next)}
          onCropChange={(next) => onUpdate(idx, 'beforeCrop', next)}
          onAssetIdChange={(next) => onUpdate(idx, 'beforeAssetId', next)}
          onUpload={(file) => onUpload(idx, 'beforeImage', file)}
          onPickAsset={onPickAsset}
        />
      </div>
      <div style={{ ...panelStyle, gap: '14px' }}>
        <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>After image</div>
        <BasicCoverFieldEditor
          url={data.afterImage}
          crop={data.afterCrop}
          assetId={data.afterAssetId}
          aspectRatio="16 / 9"
          openCropOnPortraitUpload
          onUrlChange={(next) => onUpdate(idx, 'afterImage', next)}
          onCropChange={(next) => onUpdate(idx, 'afterCrop', next)}
          onAssetIdChange={(next) => onUpdate(idx, 'afterAssetId', next)}
          onUpload={(file) => onUpload(idx, 'afterImage', file)}
          onPickAsset={onPickAsset}
        />
      </div>
    </>
  );
  if (block.type === 'refinedSlider') return (
    <RefinedSliderEditor data={data} idx={idx} onUpdate={onUpdate} onUpload={onUpload} onPickAsset={onPickAsset} formTitle={formTitle} compact={compact} />
  );
  if (block.type === 'circleDetail') return (
    <CircleDetailEditor data={data} idx={idx} onUpdate={onUpdate} onUpload={onUpload} onPickAsset={onPickAsset} formTitle={formTitle} compact={compact} />
  );
  if (block.type === 'editorialNote') return (
    <>
      {field('Eyebrow', 'eyebrow')}
      {field('Title', 'title', { ai: true })}
      {field('Note', 'note', { textarea: true, rows: 5, ai: true })}
      <BasicCoverFieldEditor
        url={data.image}
        crop={data.crop}
        assetId={data.assetId}
        aspectRatio="4 / 5"
        onUrlChange={(next) => onUpdate(idx, 'image', next)}
        onCropChange={(next) => onUpdate(idx, 'crop', next)}
        onAssetIdChange={(next) => onUpdate(idx, 'assetId', next)}
        onUpload={(file) => onUpload(idx, 'image', file)}
        onPickAsset={onPickAsset}
      />
    </>
  );
  if (block.type === 'mosaicPreset') return (
    <MosaicPresetEditor data={data} idx={idx} onUpdate={onUpdate} onUpload={onUpload} onPickAsset={onPickAsset} formTitle={formTitle} compact={compact} />
  );
  if (block.type === 'photoSequence') {
    const rows = Array.isArray(data.items) ? data.items : [];
    const updateRows = (nextRows: any[]) => onUpdate(idx, 'items', nextRows);
    const normalizeRow = (row: any) => {
      const layout = row?.layout === 'pair' ? 'pair' : 'wide';
      const count = layout === 'pair' ? 2 : 1;
      const images = Array.from({ length: count }, (_, imageIndex) => toEditableImage(row?.images?.[imageIndex]));
      return { layout, images };
    };

    return (
      <div style={{ display: 'grid', gap: '12px' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
          Horizontal row = one wide image. Vertical row = two portrait images side by side.
        </div>
        {rows.map((row: any, rowIndex: number) => {
          const editableRow = normalizeRow(row);
          return (
            <div key={rowIndex} style={{ ...panelStyle, gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                <select
                  value={editableRow.layout}
                  onChange={(event) => {
                    const nextLayout = event.target.value === 'pair' ? 'pair' : 'wide';
                    const nextCount = nextLayout === 'pair' ? 2 : 1;
                    const next = [...rows];
                    next[rowIndex] = {
                      layout: nextLayout,
                      images: Array.from({ length: nextCount }, (_, imageIndex) => toEditableImage(editableRow.images[imageIndex])),
                    };
                    updateRows(next);
                  }}
                  style={{ ...inputStyle, maxWidth: 260 }}
                >
                  <option value="wide" style={{ background: '#141414' }}>Horizontal full-width photo</option>
                  <option value="pair" style={{ background: '#141414' }}>Two vertical photos</option>
                </select>
                <button type="button" style={{ ...miniBtn, color: '#ff8a80' }} onClick={() => updateRows(rows.filter((_: any, nextIndex: number) => nextIndex !== rowIndex))}>Remove row</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: editableRow.layout === 'pair' && !compact ? '1fr 1fr' : '1fr', gap: '10px' }}>
                {editableRow.images.map((image, imageIndex) => (
                  <EditableCoverFieldEditor
                    key={imageIndex}
                    value={image}
                    aspectRatio={editableRow.layout === 'pair' ? '4 / 5' : '16 / 9'}
                    cropEnabled={false}
                    previewMaxWidth="100%"
                    onChange={(nextImage) => {
                      const next = rows.map((item: any, nextIndex: number) => (nextIndex === rowIndex ? normalizeRow(item) : item));
                      next[rowIndex].images[imageIndex] = { ...nextImage, alt: nextImage.alt || formTitle };
                      updateRows(next.map((item: any) => ({ layout: item.layout, images: item.images.filter((nextItem: any) => nextItem.url).map((nextItem: any) => ({ url: nextItem.url, alt: nextItem.alt || formTitle, crop: nextItem.crop, assetId: nextItem.assetId || '' })) })));
                    }}
                    onUpload={(file) => onUpload(idx, `photoSequence-${rowIndex}-${imageIndex}`, file)}
                    onPickAsset={onPickAsset}
                  />
                ))}
              </div>
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" style={miniBtn} onClick={() => updateRows([...rows, { layout: 'wide', images: [] }])}>+ Horizontal photo</button>
          <button type="button" style={miniBtn} onClick={() => updateRows([...rows, { layout: 'pair', images: [] }])}>+ Two vertical photos</button>
        </div>
      </div>
    );
  }

  return <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>No fields</p>;
}
