import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const EMPTY_BLOCK = { type: 'heroImage', data: {} };

const BLOCK_TYPES = [
  { value: 'heroImage', label: 'Hero Image' },
  { value: 'imageGrid', label: 'Image Grid' },
  { value: 'metaInfo', label: 'Meta Info' },
  { value: 'typography', label: 'Typography' },
  { value: 'sideBySide', label: 'Side by Side' },
  { value: 'ctaSection', label: 'CTA Section' },
  { value: 'beforeAfter', label: 'Before / After' },
];

export default function AdminPage({ data, refresh }) {
  const [authed, setAuthed] = useState(!!api.getStoredToken());
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [adminData, setAdminData] = useState(data);
  const [activeTab, setActiveTab] = useState('projects'); // projects, categories

  const selectedProject = useMemo(
    () => adminData.projects?.find((p) => p.id === selectedId),
    [adminData.projects, selectedId]
  );

  async function syncAdminData() {
    setLoadingAdmin(true);
    try {
      const payload = await api.getAdminContent();
      setAdminData(payload);
    } catch {
      api.clearToken();
      setAuthed(false);
      setAuthError('Session expired. Please sign in again.');
    } finally {
      setLoadingAdmin(false);
    }
  }

  useEffect(() => {
    if (authed) syncAdminData();
  }, [authed]);

  async function login(e) {
    e.preventDefault();
    setAuthError('');
    setSaving(true);
    try {
      await api.login(username, password);
      setAuthed(true);
      setPassword('');
      await syncAdminData();
    } catch {
      setAuthError('Wrong username or password');
      api.clearToken();
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    setSaving(true);
    try {
      await api.logout();
      setAuthed(false);
      setSelectedId('');
      setForm(null);
    } finally {
      setSaving(false);
    }
  }

  function startNew() {
    setSelectedId('');
    const firstCat = adminData.categories?.[0];
    setForm({
      title: '',
      slug: '',
      categoryId: firstCat?.id || '',
      content: [],
      isFeatured: false,
      isPublished: true,
      seoTitle: '',
      seoDescription: '',
    });
  }

  function startEdit(project) {
    setSelectedId(project.id);
    const content = typeof project.content === 'string' ? JSON.parse(project.content) : project.content;
    setForm({
      title: project.title || '',
      slug: project.slug || '',
      categoryId: project.categoryId || '',
      content: content || [],
      isFeatured: project.isFeatured || false,
      isPublished: project.isPublished !== false,
      seoTitle: project.seoTitle || '',
      seoDescription: project.seoDescription || '',
    });
  }

  function change(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from title
      if (field === 'title' && !prev.slug) {
        next.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      }
      return next;
    });
  }

  function addBlock(type) {
    const block = { type, data: {}, id: crypto.randomUUID?.() || Date.now().toString() };
    setForm((prev) => ({ ...prev, content: [...(prev.content || []), block] }));
  }

  function removeBlock(index) {
    setForm((prev) => ({ ...prev, content: (prev.content || []).filter((_, i) => i !== index) }));
  }

  function moveBlock(index, direction) {
    setForm((prev) => {
      const arr = [...(prev.content || [])];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= arr.length) return prev;
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return { ...prev, content: arr };
    });
  }

  function updateBlock(index, field, value) {
    setForm((prev) => {
      const arr = [...(prev.content || [])];
      arr[index] = { ...arr[index], data: { ...arr[index].data, [field]: value } };
      return { ...prev, content: arr };
    });
  }

  async function saveProject(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        content: JSON.stringify(form.content || []),
      };

      if (selectedId) await api.updateProject(selectedId, payload);
      else await api.createProject(payload);

      await syncAdminData();
      await refresh();
      startNew();
    } catch (err) {
      alert('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeProject() {
    if (!selectedId) return;
    if (!window.confirm('Delete this project?')) return;
    setSaving(true);
    try {
      await api.deleteProject(selectedId);
      await syncAdminData();
      await refresh();
      startNew();
    } finally {
      setSaving(false);
    }
  }

  // Image upload helper
  async function uploadImageToBlock(blockIndex, field, file) {
    if (!file) return;
    setSaving(true);
    try {
      const result = await api.uploadImage(file, form.title, blockIndex);
      updateBlock(blockIndex, field, result.url);
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!authed) {
    return (
      <main className="container page-pad admin-page">
        <h1>Admin Login</h1>
        <form className="admin-login reveal is-visible" onSubmit={login}>
          <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {authError ? <p className="error-text">{authError}</p> : null}
          <button className="btn-primary" disabled={saving}>{saving ? 'Signing in...' : 'Sign in'}</button>
          <p className="admin-note">Default: <code>admin</code> / <code>admin123</code></p>
        </form>
      </main>
    );
  }

  return (
    <main className="container page-pad admin-page">
      {/* Tabs */}
      <div className="admin-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button className={`btn-secondary ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>Projects</button>
        <button className={`btn-secondary ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>Categories</button>
        <button className="btn-secondary" onClick={logout} style={{ marginLeft: 'auto' }}>Logout</button>
      </div>

      {activeTab === 'projects' && (
        <div className="admin-grid">
          {/* Project list */}
          <section className="admin-panel reveal is-visible">
            <div className="admin-panel-head">
              <h2>Projects</h2>
              <button className="btn-secondary" onClick={startNew}>+ New</button>
            </div>
            <div className="admin-list">
              {adminData.projects?.map((project) => (
                <button
                  type="button"
                  key={project.id}
                  className={`admin-list-item ${selectedId === project.id ? 'active' : ''}`}
                  onClick={() => startEdit(project)}
                >
                  <span>{project.title}</span>
                  <small>{project.isPublished ? 'Published' : 'Draft'}</small>
                </button>
              ))}
            </div>
          </section>

          {/* Block editor */}
          <section className="admin-panel reveal is-visible" style={{ gridColumn: 'span 2' }}>
            <h2>{selectedProject ? 'Edit project' : 'Add project'}</h2>
            {form && (
              <form className="admin-form" onSubmit={saveProject}>
                {/* Basic fields */}
                <label>Title<input value={form.title} onChange={(e) => change('title', e.target.value)} required /></label>
                <label>Slug<input value={form.slug} onChange={(e) => change('slug', e.target.value)} placeholder="auto-generated" /></label>
                <label>
                  Category
                  <select value={form.categoryId} onChange={(e) => change('categoryId', e.target.value)} required>
                    {adminData.categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>

                {/* SEO */}
                <details style={{ marginBottom: '10px' }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: '0.88rem' }}>SEO Settings</summary>
                  <div style={{ display: 'grid', gap: '0.6rem', marginTop: '0.6rem' }}>
                    <label>SEO Title<input value={form.seoTitle} onChange={(e) => change('seoTitle', e.target.value)} /></label>
                    <label>SEO Description<textarea rows="2" value={form.seoDescription} onChange={(e) => change('seoDescription', e.target.value)} /></label>
                  </div>
                </details>

                {/* Toggles */}
                <label className="check"><input type="checkbox" checked={!!form.isFeatured} onChange={(e) => change('isFeatured', e.target.checked)} /> Featured on home</label>
                <label className="check"><input type="checkbox" checked={!!form.isPublished} onChange={(e) => change('isPublished', e.target.checked)} /> Published</label>

                {/* Block builder */}
                <div style={{ marginTop: '15px', padding: '10px', background: '#f8f6f3', borderRadius: '10px' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: '1rem' }}>Content Blocks</h3>

                  {/* Add block buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
                    {BLOCK_TYPES.map((bt) => (
                      <button
                        key={bt.value}
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                        onClick={() => addBlock(bt.value)}
                      >
                        + {bt.label}
                      </button>
                    ))}
                  </div>

                  {/* Blocks list */}
                  {(form.content || []).map((block, i) => (
                    <div key={block.id || i} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{block.type}</strong>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0} style={{ fontSize: '0.75rem' }}>↑</button>
                          <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === (form.content || []).length - 1} style={{ fontSize: '0.75rem' }}>↓</button>
                          <button type="button" onClick={() => removeBlock(i)} style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>✕</button>
                        </div>
                      </div>

                      {/* Block fields by type */}
                      {block.type === 'heroImage' && (
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <label>Image URL<input value={block.data.image || ''} onChange={(e) => updateBlock(i, 'image', e.target.value)} /></label>
                          <label>Upload<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadImageToBlock(i, 'image', e.target.files?.[0])} /></label>
                          <label>Title<input value={block.data.title || ''} onChange={(e) => updateBlock(i, 'title', e.target.value)} /></label>
                          <label>Subtitle<input value={block.data.subtitle || ''} onChange={(e) => updateBlock(i, 'subtitle', e.target.value)} /></label>
                          <label>Alt text<input value={block.data.alt || ''} onChange={(e) => updateBlock(i, 'alt', e.target.value)} /></label>
                        </div>
                      )}

                      {block.type === 'imageGrid' && (
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <label>Images (URLs, one per line)
                            <textarea rows="4" value={(block.data.images || []).map(img => img.url).join('\n')}
                              onChange={(e) => {
                                const urls = e.target.value.split('\n').filter(Boolean);
                                updateBlock(i, 'images', urls.map(url => ({ url, alt: form.title })));
                              }}
                            />
                          </label>
                          <label>Upload multiple<input type="file" accept="image/jpeg,image/png,image/webp" multiple
                            onChange={async (e) => {
                              if (!e.target.files?.length) return;
                              setSaving(true);
                              const urls = [];
                              for (const file of Array.from(e.target.files)) {
                                try {
                                  const result = await api.uploadImage(file, form.title, i);
                                  urls.push({ url: result.url, alt: form.title });
                                } catch (err) { alert(err.message); }
                              }
                              const existing = block.data.images || [];
                              updateBlock(i, 'images', [...existing, ...urls]);
                              setSaving(false);
                            }}
                          /></label>
                          <label>Columns
                            <select value={block.data.columns || 2} onChange={(e) => updateBlock(i, 'columns', Number(e.target.value))}>
                              <option value={1}>1</option>
                              <option value={2}>2</option>
                              <option value={3}>3</option>
                            </select>
                          </label>
                        </div>
                      )}

                      {block.type === 'metaInfo' && (
                        <label>Items (label:value, one per line)
                          <textarea rows="3" value={(block.data.items || []).map(it => `${it.label}: ${it.value}`).join('\n')}
                            onChange={(e) => {
                              const items = e.target.value.split('\n').filter(Boolean).map(line => {
                                const [label, ...rest] = line.split(':');
                                return { label: label.trim(), value: rest.join(':').trim() };
                              });
                              updateBlock(i, 'items', items);
                            }}
                          />
                        </label>
                      )}

                      {block.type === 'typography' && (
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <label>Title<input value={block.data.title || ''} onChange={(e) => updateBlock(i, 'title', e.target.value)} /></label>
                          <label>Content<textarea rows="5" value={block.data.content || ''} onChange={(e) => updateBlock(i, 'content', e.target.value)} /></label>
                          <label>Size
                            <select value={block.data.size || 'md'} onChange={(e) => updateBlock(i, 'size', e.target.value)}>
                              <option value="sm">Small</option>
                              <option value="md">Medium</option>
                              <option value="lg">Large</option>
                            </select>
                          </label>
                        </div>
                      )}

                      {block.type === 'sideBySide' && (
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <label>Title<input value={block.data.title || ''} onChange={(e) => updateBlock(i, 'title', e.target.value)} /></label>
                          <label>Text<textarea rows="4" value={block.data.text || ''} onChange={(e) => updateBlock(i, 'text', e.target.value)} /></label>
                          <label>Image URL<input value={block.data.image || ''} onChange={(e) => updateBlock(i, 'image', e.target.value)} /></label>
                          <label>Upload<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadImageToBlock(i, 'image', e.target.files?.[0])} /></label>
                          <label>Image position
                            <select value={block.data.imagePosition || 'left'} onChange={(e) => updateBlock(i, 'imagePosition', e.target.value)}>
                              <option value="left">Left</option>
                              <option value="right">Right</option>
                            </select>
                          </label>
                        </div>
                      )}

                      {block.type === 'ctaSection' && (
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <label>Title<input value={block.data.title || ''} onChange={(e) => updateBlock(i, 'title', e.target.value)} /></label>
                          <label>Text<textarea rows="2" value={block.data.text || ''} onChange={(e) => updateBlock(i, 'text', e.target.value)} /></label>
                          <label>Button text<input value={block.data.buttonText || ''} onChange={(e) => updateBlock(i, 'buttonText', e.target.value)} /></label>
                          <label>Button link<input value={block.data.buttonLink || ''} onChange={(e) => updateBlock(i, 'buttonLink', e.target.value)} placeholder="/contact" /></label>
                        </div>
                      )}

                      {block.type === 'beforeAfter' && (
                        <div style={{ display: 'grid', gap: '6px' }}>
                          <label>Title<input value={block.data.title || ''} onChange={(e) => updateBlock(i, 'title', e.target.value)} /></label>
                          <label>Before image URL<input value={block.data.beforeImage || ''} onChange={(e) => updateBlock(i, 'beforeImage', e.target.value)} /></label>
                          <label>Upload before<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadImageToBlock(i, 'beforeImage', e.target.files?.[0])} /></label>
                          <label>After image URL<input value={block.data.afterImage || ''} onChange={(e) => updateBlock(i, 'afterImage', e.target.value)} /></label>
                          <label>Upload after<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadImageToBlock(i, 'afterImage', e.target.files?.[0])} /></label>
                        </div>
                      )}
                    </div>
                  ))}

                  {(!form.content || form.content.length === 0) && (
                    <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', padding: '20px' }}>
                      Click a block type above to add content blocks
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="form-actions">
                  <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save project'}</button>
                  {selectedId ? <button type="button" className="btn-danger" onClick={removeProject}>Delete</button> : null}
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {activeTab === 'categories' && (
        <section className="admin-panel reveal is-visible">
          <h2>Categories</h2>
          <div className="admin-list">
            {adminData.categories?.map((cat) => (
              <div key={cat.id} className="admin-list-item" style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{cat.name}</span>
                  <label className="check" style={{ fontSize: '0.8rem' }}>
                    <input
                      type="checkbox"
                      checked={cat.showInHeader}
                      onChange={async (e) => {
                        try {
                          await api.updateCategory(cat.id, { showInHeader: e.target.checked });
                          await syncAdminData();
                        } catch (err) { alert(err.message); }
                      }}
                    />
                    Show in header
                  </label>
                </div>
                <small>slug: {cat.slug}</small>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
