import React, { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../lib/api';
import { getCoverImageStyle } from '../lib/imageTransforms';

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
];

function toSlug(t: string) {
  if (!t) return '';
  return t.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function parseContent(content: any) {
  if (!content) return [];
  if (typeof content === 'string') {
    try { return JSON.parse(content); } catch { return []; }
  }
  return Array.isArray(content) ? content : [];
}

function getHeroImage(content: any[]) {
  return content.find((block: any) => block.type === 'heroImage')?.data?.image || '';
}

function getProjectImages(content: any[]) {
  const hero = getHeroImage(content);
  const gridImages = content
    .flatMap((block: any) => {
      if (block.type === 'imageGrid') return block.data?.images || [];
      if (block.type === 'refinedSlider') return block.data?.images || [];
      if (block.type === 'mosaicPreset') return block.data?.images || [];
      return [];
    })
    .map((item: any) => typeof item === 'string' ? item : item?.url)
    .filter(Boolean);

  const base = [hero, ...gridImages].filter(Boolean);
  return base.length ? base : [''];
}

function buildDemoProjectBlocks(project: any, categoryName: string) {
  const current = parseContent(project.content);
  const baseImages = getProjectImages(current);
  const fallbackImage = baseImages[0] || '';
  if (!fallbackImage) return current;

  const repeated = Array.from({ length: 4 }, (_, index) => ({
    url: baseImages[index] || fallbackImage,
    alt: `${project.title} ${index + 1}`,
  }));

  const existingHero = current.find((block: any) => block.type === 'heroImage');

  return [
    existingHero || {
      id: `hero-${Date.now()}`,
      type: 'heroImage',
      data: {
        title: project.title,
        subtitle: `${categoryName} project in ${project.cityName || 'California'} with a cleaner, more intentional presentation.`,
        image: fallbackImage,
        alt: project.title,
      },
    },
    {
      id: `editorial-${Date.now()}`,
      type: 'editorialNote',
      data: {
        eyebrow: categoryName,
        title: 'Project overview',
        note: `${project.title} is presented as a richer portfolio story: concept, material rhythm, day-to-day function, and the final visual atmosphere.`,
        image: repeated[1]?.url || fallbackImage,
      },
    },
    {
      id: `typography-${Date.now()}`,
      type: 'typography',
      data: {
        title: 'What was done',
        content: 'Space planning, storage logic, material coordination, finish selection, lighting balance, and a calmer visual composition for daily use.',
        size: 'lg',
      },
    },
    {
      id: `slider-${Date.now()}`,
      type: 'refinedSlider',
      data: {
        title: 'Walkthrough highlights',
        description: 'A cleaner image sequence for key moments of the project.',
        thumbnailPosition: 'bottom',
        images: repeated,
      },
    },
    {
      id: `circle-${Date.now()}`,
      type: 'circleDetail',
      data: {
        title: 'Key details',
        description: 'A quick visual summary of accents and focal points.',
        items: [
          { label: 'Cabinet lines', image: repeated[0].url, alt: 'Cabinet lines' },
          { label: 'Finish palette', image: repeated[1].url, alt: 'Finish palette' },
          { label: 'Lighting mood', image: repeated[2].url, alt: 'Lighting mood' },
          { label: 'Material balance', image: repeated[3].url, alt: 'Material balance' },
        ],
      },
    },
    {
      id: `mosaic-${Date.now()}`,
      type: 'mosaicPreset',
      data: {
        title: 'Project composition',
        preset: 'a',
        images: repeated,
      },
    },
    {
      id: `before-${Date.now()}`,
      type: 'beforeAfter',
      data: {
        title: 'Before / After',
        beforeImage: repeated[0].url,
        afterImage: repeated[1].url || repeated[0].url,
      },
    },
    {
      id: `cta-${Date.now()}`,
      type: 'ctaSection',
      data: {
        title: 'Discuss a similar project',
        text: 'Use this section as a placeholder until the final client-facing copy is ready.',
        buttonText: 'Contact us',
        buttonLink: '/contact',
      },
    },
  ];
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
type EditableImage = { url: string; alt?: string; crop: CropData };
type CircleItem = { label?: string; image: string; alt?: string; crop: CropData };

function ensureCrop(crop?: any): CropData {
  return {
    scale: Number(crop?.scale ?? 1),
    x: Number(crop?.x ?? 0),
    y: Number(crop?.y ?? 0),
  };
}

function toEditableImage(item?: any): EditableImage {
  if (!item) return { url: '', alt: '', crop: ensureCrop() };
  if (typeof item === 'string') return { url: item, alt: '', crop: ensureCrop() };
  return { url: item.url || '', alt: item.alt || '', crop: ensureCrop(item.crop) };
}

function toCircleItem(item?: any): CircleItem {
  if (!item) return { label: '', image: '', alt: '', crop: ensureCrop() };
  return {
    label: item.label || '',
    image: item.image || '',
    alt: item.alt || '',
    crop: ensureCrop(item.crop),
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

function CropEditor({ crop, onChange }: { crop: CropData; onChange: (next: CropData) => void }) {
  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      <label style={labelStyle}>Scale<input type="range" min="1" max="2.5" step="0.01" value={crop.scale} onChange={(e) => onChange({ ...crop, scale: Number(e.target.value) })} /></label>
      <label style={labelStyle}>Offset X<input type="range" min="-35" max="35" step="1" value={crop.x} onChange={(e) => onChange({ ...crop, x: Number(e.target.value) })} /></label>
      <label style={labelStyle}>Offset Y<input type="range" min="-35" max="35" step="1" value={crop.y} onChange={(e) => onChange({ ...crop, y: Number(e.target.value) })} /></label>
    </div>
  );
}

function MosaicPresetEditor({
  data,
  idx,
  onUpdate,
  onUpload,
  formTitle,
}: {
  data: any;
  idx: number;
  onUpdate: (i: number, f: string, v: any) => void;
  onUpload: (i: number, f: string, file: File) => Promise<any> | any;
  formTitle: string;
}) {
  const [selected, setSelected] = useState(0);
  const images = Array.from({ length: 4 }, (_, index) => toEditableImage((data.images || [])[index]));
  const current = images[selected];

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

      <div style={{ ...slotGridStyle, gridTemplateColumns: data.preset === 'b' ? '0.85fr 1.15fr 1.15fr' : '1.25fr 0.75fr 0.75fr' }}>
        {images.map((image, imageIndex) => (
          <button key={imageIndex} type="button" onClick={() => setSelected(imageIndex)} style={{ padding: 0, border: imageIndex === selected ? '1px solid rgba(198,164,123,0.85)' : '1px solid rgba(255,255,255,0.08)', background: 'transparent', borderRadius: '16px', overflow: 'hidden' }}>
            <CoverPreview url={image.url} crop={image.crop} aspectRatio={imageIndex === 0 ? '4 / 5' : '1 / 1'} />
          </button>
        ))}
      </div>

      <div style={panelStyle}>
        <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Selected cell {selected + 1}</div>
        <label style={labelStyle}>Image URL<input value={current.url} onChange={(e) => updateImage(selected, { ...current, url: e.target.value, alt: current.alt || formTitle })} style={inputStyle} /></label>
        <label style={labelStyle}>Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => { if (!e.target.files?.[0]) return; const uploaded = await onUpload(idx, `mosaicUpload-${selected}`, e.target.files[0]); if (uploaded?.url) updateImage(selected, { ...current, url: uploaded.url, alt: current.alt || formTitle }); }} style={{ ...inputStyle, padding: '6px' }} /></label>
        <CropEditor crop={current.crop} onChange={(crop) => updateImage(selected, { ...current, crop })} />
      </div>
    </div>
  );
}

function CircleDetailEditor({
  data,
  idx,
  onUpdate,
  onUpload,
  formTitle,
}: {
  data: any;
  idx: number;
  onUpdate: (i: number, f: string, v: any) => void;
  onUpload: (i: number, f: string, file: File) => Promise<any> | any;
  formTitle: string;
}) {
  const [selected, setSelected] = useState(0);
  const items = Array.from({ length: Math.max((data.items || []).length, 5) }, (_, index) => toCircleItem((data.items || [])[index]));
  const current = items[selected];

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
      </div>

      <div style={{ ...slotGridStyle, gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        {items.map((item, itemIndex) => (
          <button key={itemIndex} type="button" onClick={() => setSelected(itemIndex)} style={{ padding: 0, border: 0, background: 'transparent', color: '#fff' }}>
            <div style={{ border: itemIndex === selected ? '1px solid rgba(198,164,123,0.85)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '999px', padding: '4px' }}>
              <CoverPreview url={item.image} crop={item.crop} radius="999px" />
            </div>
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.72)' }}>{item.label || `Circle ${itemIndex + 1}`}</div>
          </button>
        ))}
      </div>

      <div style={panelStyle}>
        <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Selected circle {selected + 1}</div>
        <label style={labelStyle}>Label<input value={current.label || ''} onChange={(e) => updateItem(selected, { ...current, label: e.target.value, alt: e.target.value || formTitle })} style={inputStyle} /></label>
        <label style={labelStyle}>Image URL<input value={current.image} onChange={(e) => updateItem(selected, { ...current, image: e.target.value, alt: current.alt || current.label || formTitle })} style={inputStyle} /></label>
        <label style={labelStyle}>Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => { if (!e.target.files?.[0]) return; const uploaded = await onUpload(idx, `circleUpload-${selected}`, e.target.files[0]); if (uploaded?.url) updateItem(selected, { ...current, image: uploaded.url, alt: current.alt || current.label || formTitle }); }} style={{ ...inputStyle, padding: '6px' }} /></label>
        <CropEditor crop={current.crop} onChange={(crop) => updateItem(selected, { ...current, crop })} />
      </div>
    </div>
  );
}

function RefinedSliderEditor({
  data,
  idx,
  onUpdate,
  onUpload,
  formTitle,
}: {
  data: any;
  idx: number;
  onUpdate: (i: number, f: string, v: any) => void;
  onUpload: (i: number, f: string, file: File) => Promise<any> | any;
  formTitle: string;
}) {
  const [selected, setSelected] = useState(0);
  const images = Array.from({ length: Math.max((data.images || []).length, 4) }, (_, index) => toEditableImage((data.images || [])[index]));
  const current = images[selected];

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

      <div style={{ ...panelStyle, gap: '10px' }}>
        <div style={{ aspectRatio: '16 / 10', borderRadius: '18px', overflow: 'hidden', background: 'radial-gradient(circle at center, rgba(255,255,255,0.08), rgba(20,20,20,0.88))', border: '1px solid rgba(255,255,255,0.08)' }}>
          {current.url ? <img src={current.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.28)', fontSize: '12px' }}>Empty slide</div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
          {images.map((image, imageIndex) => (
            <button key={imageIndex} type="button" onClick={() => setSelected(imageIndex)} style={{ padding: 0, border: imageIndex === selected ? '1px solid rgba(198,164,123,0.85)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', background: 'transparent' }}>
              <CoverPreview url={image.url} aspectRatio="4 / 5" />
            </button>
          ))}
        </div>
      </div>

      <div style={panelStyle}>
        <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Selected slide {selected + 1}</div>
        <label style={labelStyle}>Image URL<input value={current.url} onChange={(e) => updateImage(selected, { ...current, url: e.target.value, alt: current.alt || formTitle })} style={inputStyle} /></label>
        <label style={labelStyle}>Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => { if (!e.target.files?.[0]) return; const uploaded = await onUpload(idx, `sliderUpload-${selected}`, e.target.files[0]); if (uploaded?.url) updateImage(selected, { ...current, url: uploaded.url, alt: current.alt || formTitle }); }} style={{ ...inputStyle, padding: '6px' }} /></label>
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
  const [adminData, setAdminData] = useState(data || { projects: [], categories: [], blogPosts: [] });
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
  const [blogContent, setBlogContent] = useState('');

  const categoryName = useMemo(
    () => adminData.categories?.find((category: any) => category.id === form?.categoryId)?.name || 'Project',
    [adminData.categories, form?.categoryId],
  );

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

  useEffect(() => { if (authed) sync(); }, [authed]);

  useEffect(() => {
    if (tab !== 'beforeafter') return;
    const toggles: Record<string, boolean> = {};
    adminData.projects
      .filter((project: any) => parseContent(project.content).some((block: any) => block.type === 'beforeAfter'))
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
    setSelId('');
    setForm({
      title: '',
      slug: '',
      categoryId: firstCategory?.id || '',
      content: [],
      isFeatured: false,
      isPublished: true,
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      cityName: '',
      year: '',
    });
  }

  function editProject(project: any) {
    setSelId(project.id);
    setForm({
      title: project.title || '',
      slug: project.slug || '',
      categoryId: project.categoryId || '',
      content: parseContent(project.content),
      isFeatured: !!project.isFeatured,
      isPublished: project.isPublished !== false,
      seoTitle: project.seoTitle || '',
      seoDescription: project.seoDescription || '',
      seoKeywords: project.seoKeywords || '',
      cityName: project.cityName || '',
      year: project.year || '',
    });
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
      content: [...(prev.content || []), { type, data: {}, id: Date.now().toString() }],
    }));
  }

  function removeBlock(index: number) {
    setForm((prev: any) => ({
      ...prev,
      content: (prev.content || []).filter((_: any, i: number) => i !== index),
    }));
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
      const uploaded = await api.uploadImage(file, form.title, `${blockIdx}-${field}`);
      if (!field.toLowerCase().includes('upload')) setBlock(blockIdx, field, uploaded.url);
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
      newProject();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject() {
    if (!selId || !confirm('Delete this project?')) return;
    setSaving(true);
    try {
      await api.deleteProject(selId);
      await sync();
      await refresh();
      newProject();
    } finally {
      setSaving(false);
    }
  }

  function applyDemoLayout() {
    setForm((prev: any) => ({
      ...prev,
      content: buildDemoProjectBlocks(prev, categoryName),
    }));
  }

  function newBlog() {
    setBlogSelId('');
    setBlogForm({
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
    });
    setBlogContent('');
  }

  function editBlog(post: any) {
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
    setBlogContent(post.content || '');
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
      const payload = { ...blogForm, content: blogContent };
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
    return getHeroImage(parseContent(project.content));
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
    { id: 'projects', label: 'Projects' },
    { id: 'categories', label: 'Categories' },
    { id: 'beforeafter', label: 'Before & After' },
    { id: 'blog', label: 'Blog' },
  ];

  return (
    <main className="container" style={{ padding: '100px 15px 60px', maxWidth: '1400px' }}>
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

      {tab === 'projects' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '18px' }}>{form ? 'Editing Project' : 'Projects'}</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              {form ? (
                <button onClick={() => { setSelId(''); setForm(null); }} style={{ ...miniBtn, padding: '8px 16px', background: 'rgba(255,255,255,0.1)' }}>
                  Back to List
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
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{project.cityName || ''} {project.year ? `(${project.year})` : ''}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: project.isPublished ? 'rgba(39,174,96,0.2)' : 'rgba(231,76,60,0.2)', color: project.isPublished ? '#27ae60' : '#e74c3c' }}>{project.isPublished ? 'Published' : 'Draft'}</span>
                      {project.isFeatured ? <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(140,106,78,0.2)', color: '#8c6a4e' }}>Featured</span> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ ...cardStyle, maxHeight: '80vh', overflow: 'auto' }}>
              <h3 style={{ color: '#fff', margin: '0 0 15px', fontSize: '16px' }}>{selId ? 'Edit Project' : 'New Project'}</h3>
              <form onSubmit={saveProject} style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={labelStyle}>Title<input value={form.title} onChange={(e) => setF('title', e.target.value)} required style={inputStyle} /></label>
                  <label style={labelStyle}>Slug<input value={form.slug} onChange={(e) => setF('slug', e.target.value)} style={inputStyle} placeholder="auto-generated" /></label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <label style={labelStyle}>Category<select value={form.categoryId} onChange={(e) => setF('categoryId', e.target.value)} required style={inputStyle}>{adminData.categories?.map((category: any) => <option key={category.id} value={category.id} style={{ background: '#141414' }}>{category.name}</option>)}</select></label>
                  <label style={labelStyle}>City<input value={form.cityName} onChange={(e) => setF('cityName', e.target.value)} placeholder="San Francisco" style={inputStyle} /></label>
                  <label style={labelStyle}>Year<input type="number" value={form.year} onChange={(e) => setF('year', e.target.value)} placeholder="2024" style={inputStyle} /></label>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
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

                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <h4 style={{ color: '#fff', margin: 0, fontSize: '14px' }}>Content Blocks</h4>
                    <button type="button" onClick={applyDemoLayout} style={{ ...miniBtn, borderColor: 'rgba(198,164,123,0.45)', color: 'rgba(198,164,123,1)' }}>
                      Apply Demo Layout
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                    {BLOCK_TYPES.map((blockType) => (
                      <button key={blockType.value} type="button" onClick={() => addBlock(blockType.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '11px' }}>
                        {blockType.label}
                      </button>
                    ))}
                  </div>
                  {(form.content || []).map((block: any, index: number) => (
                    <div key={block.id || index} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>{block.type}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} style={miniBtn}>↑</button>
                          <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === (form.content || []).length - 1} style={miniBtn}>↓</button>
                          <button type="button" onClick={() => removeBlock(index)} style={{ ...miniBtn, color: '#e74c3c' }}>✕</button>
                        </div>
                      </div>
                      <BlockEditor block={block} idx={index} onUpdate={setBlock} onUpload={uploadBlockImg} formTitle={form.title} />
                    </div>
                  ))}
                  {(!form.content || !form.content.length) ? <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '15px', margin: 0 }}>Click a block type above to start building</p> : null}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save Project'}</button>
                  {selId ? <button type="button" onClick={deleteProject} style={{ ...miniBtn, padding: '10px 20px', background: '#e74c3c', border: 'none' }}>Delete</button> : null}
                </div>
              </form>
            </div>
          )}
        </div>
      ) : null}

      {tab === 'blog' ? (
        <div style={{ display: 'grid', gridTemplateColumns: blogSelId ? '300px 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
          <div style={{ ...cardStyle, maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>Blog Posts</h3>
              <button onClick={newBlog} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>+ New</button>
            </div>
            {adminData.blogPosts?.map((post: any) => (
              <div key={post.id} onClick={() => editBlog(post)} style={{ padding: '10px', borderRadius: '8px', cursor: 'pointer', background: blogSelId === post.id ? 'rgba(198,164,123,0.15)' : 'transparent', marginBottom: '4px' }}>
                <div style={{ color: '#fff', fontSize: '13px' }}>{post.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{post.isPublished ? 'Published' : 'Draft'}</div>
              </div>
            ))}
          </div>
          {blogForm ? (
            <div style={{ ...cardStyle, maxHeight: '80vh', overflow: 'auto' }}>
              <h3 style={{ color: '#fff', margin: '0 0 15px', fontSize: '16px' }}>{blogSelId ? 'Edit Post' : 'New Post'}</h3>
              <form onSubmit={saveBlog} style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={labelStyle}>Title<input value={blogForm.title} onChange={(e) => setBF('title', e.target.value)} required style={inputStyle} /></label>
                  <label style={labelStyle}>Slug<input value={blogForm.slug} onChange={(e) => setBF('slug', e.target.value)} style={inputStyle} placeholder="auto" /></label>
                </div>
                <label style={labelStyle}>Excerpt<textarea rows={2} value={blogForm.excerpt} onChange={(e) => setBF('excerpt', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></label>

                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '6px' }}>Content</label>
                  <div className="quill-wrapper">
                    <ReactQuill
                      theme="snow"
                      value={blogContent}
                      onChange={setBlogContent}
                      modules={{
                        toolbar: [
                          [{ header: [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ color: [] }, { background: [] }],
                          [{ list: 'ordered' }, { list: 'bullet' }],
                          [{ align: [] }],
                          ['blockquote', 'code-block'],
                          ['link', 'image', 'video'],
                          ['clean'],
                        ],
                      }}
                      formats={['header', 'bold', 'italic', 'underline', 'strike', 'color', 'background', 'list', 'bullet', 'align', 'blockquote', 'code-block', 'link', 'image', 'video']}
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', minHeight: '300px' }}
                    />
                  </div>
                </div>

                <label style={labelStyle}>Cover Image URL<input value={blogForm.coverImage} onChange={(e) => setBF('coverImage', e.target.value)} style={inputStyle} /></label>
                <label style={labelStyle}>Upload Cover<input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => { if (!e.target.files?.[0]) return; setSaving(true); try { const uploaded = await api.uploadImage(e.target.files[0], blogForm.title); setBF('coverImage', uploaded.url); } catch (err: any) { alert(err.message); } finally { setSaving(false); } }} style={{ ...inputStyle, padding: '6px' }} /></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px' }}><input type="checkbox" checked={blogForm.isPublished} onChange={(e) => setBF('isPublished', e.target.checked)} /> Published</label>

                <details style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px' }}>
                  <summary style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>SEO</summary>
                  <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
                    <label style={labelStyle}>SEO Title<input value={blogForm.seoTitle} onChange={(e) => setBF('seoTitle', e.target.value)} style={inputStyle} /></label>
                    <label style={labelStyle}>SEO Description<textarea rows={2} value={blogForm.seoDescription} onChange={(e) => setBF('seoDescription', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></label>
                    <label style={labelStyle}>Tags<input value={blogForm.tags} onChange={(e) => setBF('tags', e.target.value)} placeholder="kitchen, design" style={inputStyle} /></label>
                  </div>
                </details>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save Post'}</button>
                  {blogSelId ? <button type="button" onClick={deleteBlog} style={{ ...miniBtn, padding: '10px 20px', background: '#e74c3c', border: 'none' }}>Delete</button> : null}
                </div>
              </form>
            </div>
          ) : <div style={{ ...cardStyle, textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '60px' }}><p>Select a post or click + New</p></div>}
        </div>
      ) : null}

      {tab === 'categories' ? (
        <div style={{ display: 'grid', gridTemplateColumns: catForm ? '300px 1fr' : '1fr', gap: '20px' }}>
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
          {adminData.projects.filter((project: any) => parseContent(project.content).some((block: any) => block.type === 'beforeAfter')).length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {adminData.projects
                .filter((project: any) => parseContent(project.content).some((block: any) => block.type === 'beforeAfter'))
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

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>Loading...</div> : null}
    </main>
  );
}

function BlockEditor({
  block,
  idx,
  onUpdate,
  onUpload,
  formTitle,
}: {
  block: any;
  idx: number;
  onUpdate: (i: number, f: string, v: any) => void;
  onUpload: (i: number, f: string, file: File) => Promise<any> | any;
  formTitle: string;
}) {
  const { data } = block;

  const mediaValues = (items: any[] = [], key = 'url') =>
    items.map((item: any) => typeof item === 'string' ? item : item[key] || item.url || item.image || '').filter(Boolean);

  const field = (label: string, fieldName: string, opts: any = {}) => (
    <label style={labelStyle}>
      {label}
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

  const uploadField = (label: string, fieldName: string) => (
    <label style={labelStyle}>
      {label}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { if (e.target.files?.[0]) onUpload(idx, fieldName, e.target.files[0]); }} style={{ ...inputStyle, padding: '6px' }} />
    </label>
  );

  if (block.type === 'heroImage') return <>{field('Title', 'title')}{field('Subtitle', 'subtitle')}{field('Image URL', 'image')}{uploadField('Upload Image', 'image')}{field('Alt Text', 'alt')}</>;

  if (block.type === 'imageGrid') return (
    <>
      <div style={{ display: 'grid', gap: '6px', marginBottom: '8px' }}>
        {((data.images || []) as any[]).map((img: any, imageIndex: number) => (
          <div key={imageIndex} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {(typeof img === 'object' ? img.url : img) ? <img src={typeof img === 'object' ? img.url : img} alt="" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} /> : null}
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{typeof img === 'string' ? img : img.url}</span>
            <button type="button" onClick={() => { const next = [...(data.images || [])]; next.splice(imageIndex, 1); onUpdate(idx, 'images', next); }} style={miniBtn}>✕</button>
          </div>
        ))}
      </div>
      <label style={labelStyle}>
        Image URLs (one per line)
        <textarea rows={3} value={mediaValues(data.images).join('\n')} onChange={(e) => { const urls = e.target.value.split('\n').filter(Boolean); onUpdate(idx, 'images', urls.map((url) => ({ url, alt: formTitle }))); }} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }} />
      </label>
      <label style={labelStyle}>
        Upload Images
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={async (e) => { if (!e.target.files?.length) return; const next = [...(data.images || [])]; for (const file of Array.from(e.target.files)) { const uploaded = await onUpload(idx, 'imageGridUpload', file as File); if (uploaded?.url) next.push({ url: uploaded.url, alt: formTitle }); } onUpdate(idx, 'images', next); }} style={{ ...inputStyle, padding: '6px' }} />
      </label>
      {field('Columns', 'columns', { select: true, options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }], default: 2 })}
    </>
  );

  if (block.type === 'metaInfo') return <>{field('Items (label: value, one per line)', 'metaText', { textarea: true })}</>;
  if (block.type === 'typography') return <>{field('Title', 'title')}{field('Content', 'content', { textarea: true, rows: 5 })}{field('Size', 'size', { select: true, options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }], default: 'md' })}</>;
  if (block.type === 'sideBySide') return <>{field('Title', 'title')}{field('Text', 'text', { textarea: true, rows: 4 })}{field('Image URL', 'image')}{uploadField('Upload', 'image')}{field('Position', 'imagePosition', { select: true, options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }], default: 'left' })}</>;
  if (block.type === 'ctaSection') return <>{field('Title', 'title')}{field('Text', 'text', { textarea: true })}{field('Button Text', 'buttonText')}{field('Button Link', 'buttonLink')}</>;
  if (block.type === 'beforeAfter') return <>{field('Title', 'title')}{field('Before URL', 'beforeImage')}{uploadField('Upload Before', 'beforeImage')}{field('After URL', 'afterImage')}{uploadField('Upload After', 'afterImage')}</>;
  if (block.type === 'refinedSlider') return (
    <RefinedSliderEditor data={data} idx={idx} onUpdate={onUpdate} onUpload={onUpload} formTitle={formTitle} />
  );
  if (block.type === 'circleDetail') return (
    <CircleDetailEditor data={data} idx={idx} onUpdate={onUpdate} onUpload={onUpload} formTitle={formTitle} />
  );
  if (block.type === 'editorialNote') return <>{field('Eyebrow', 'eyebrow')}{field('Title', 'title')}{field('Note', 'note', { textarea: true, rows: 5 })}{field('Image URL', 'image')}{uploadField('Upload Image', 'image')}</>;
  if (block.type === 'mosaicPreset') return (
    <MosaicPresetEditor data={data} idx={idx} onUpdate={onUpdate} onUpload={onUpload} formTitle={formTitle} />
  );

  return <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>No fields</p>;
}
