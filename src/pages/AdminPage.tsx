import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const BLOCK_TYPES = [
  { value: 'heroImage', label: '📸 Hero Image' },
  { value: 'imageGrid', label: '🖼️ Image Grid' },
  { value: 'metaInfo', label: 'ℹ️ Meta Info' },
  { value: 'typography', label: '📝 Typography' },
  { value: 'sideBySide', label: '↔️ Side by Side' },
  { value: 'ctaSection', label: '📣 CTA Section' },
  { value: 'beforeAfter', label: '🔄 Before / After' },
];

function toSlug(t: string) { return t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim(); }

export default function AdminPage({ data, refresh }: any) {
  const [authed, setAuthed] = useState(!!api.getStoredToken());
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [adminData, setAdminData] = useState(data || { projects: [], categories: [], blogPosts: [] });
  const [stats, setStats] = useState({ projectCount: 0, publishedCount: 0, blogCount: 0, categoryCount: 0 });
  const [loading, setLoading] = useState(false);

  // Project editor state
  const [selId, setSelId] = useState('');
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Blog editor state
  const [blogSelId, setBlogSelId] = useState('');
  const [blogForm, setBlogForm] = useState<any>(null);

  async function sync() {
    setLoading(true);
    try {
      const [content, statsData] = await Promise.all([api.getAdminContent(), api.getStats()]).catch(() => [{ projects: [], categories: [], blogPosts: [] }, stats]);
      setAdminData(content);
      if (statsData) setStats(statsData);
    } catch { api.clearToken(); setAuthed(false); setAuthError('Session expired'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (authed) sync(); }, [authed]);

  async function login(e: any) {
    e.preventDefault();
    setSaving(true);
    try { await api.login(username, password); setAuthed(true); setPassword(''); await sync(); }
    catch { setAuthError('Wrong credentials'); api.clearToken(); }
    finally { setSaving(false); }
  }

  async function logout() { await api.logout(); setAuthed(false); setSelId(''); setForm(null); setBlogSelId(''); setBlogForm(null); }

  // Project helpers
  function startNewProject() {
    setSelId('');
    const c = adminData.categories?.[0];
    setForm({ title: '', slug: '', categoryId: c?.id || '', content: [], isFeatured: false, isPublished: true, seoTitle: '', seoDescription: '', seoKeywords: '', cityName: '', year: '' });
  }

  function startEditProject(p: any) {
    setSelId(p.id);
    const content = typeof p.content === 'string' ? JSON.parse(p.content) : p.content;
    setForm({ title: p.title || '', slug: p.slug || '', categoryId: p.categoryId || '', content: content || [], isFeatured: !!p.isFeatured, isPublished: p.isPublished !== false, seoTitle: p.seoTitle || '', seoDescription: p.seoDescription || '', seoKeywords: p.seoKeywords || '', cityName: p.cityName || '', year: p.year || '' });
  }

  function changeProject(field: string, value: any) {
    setForm((prev: any) => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !prev.slug) next.slug = toSlug(value);
      return next;
    });
  }

  function addBlock(type: string) {
    setForm((prev: any) => ({ ...prev, content: [...(prev.content || []), { type, data: {}, id: Date.now().toString() }] }));
  }

  function removeBlock(idx: number) { setForm((prev: any) => ({ ...prev, content: (prev.content || []).filter((_: any, i: number) => i !== idx) })); }
  function moveBlock(idx: number, dir: number) {
    setForm((prev: any) => {
      const arr = [...(prev.content || [])];
      const ni = idx + dir;
      if (ni < 0 || ni >= arr.length) return prev;
      [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
      return { ...prev, content: arr };
    });
  }
  function updateBlock(idx: number, field: string, value: any) {
    setForm((prev: any) => {
      const arr = [...(prev.content || [])];
      arr[idx] = { ...arr[idx], data: { ...arr[idx].data, [field]: value } };
      return { ...prev, content: arr };
    });
  }

  async function uploadToBlock(blockIdx: number, field: string, file: File) {
    if (!file) return;
    setSaving(true);
    try {
      const r = await api.uploadImage(file, form.title, `${blockIdx}-${field}`);
      updateBlock(blockIdx, field, r.url);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function saveProject(e: any) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, content: JSON.stringify(form.content || []) };
      if (selId) await api.updateProject(selId, payload); else await api.createProject(payload);
      await sync(); await refresh(); startNewProject();
    } catch (err: any) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  }

  async function deleteProject() {
    if (!selId || !confirm('Delete this project?')) return;
    setSaving(true);
    try { await api.deleteProject(selId); await sync(); await refresh(); startNewProject(); }
    finally { setSaving(false); }
  }

  // Blog helpers
  function startNewBlog() {
    setBlogSelId('');
    setBlogForm({ title: '', slug: '', excerpt: '', content: '', coverImage: '', isPublished: false, seoTitle: '', seoDescription: '', seoKeywords: '', tags: '' });
  }

  function startEditBlog(p: any) {
    setBlogSelId(p.id);
    setBlogForm({ title: p.title || '', slug: p.slug || '', excerpt: p.excerpt || '', content: p.content || '', coverImage: p.coverImage || '', isPublished: !!p.isPublished, seoTitle: p.seoTitle || '', seoDescription: p.seoDescription || '', seoKeywords: p.seoKeywords || '', tags: p.tags || '' });
  }

  function changeBlog(field: string, value: any) {
    setBlogForm((prev: any) => { const n = { ...prev, [field]: value }; if (field === 'title' && !prev.slug) n.slug = toSlug(value); return n; });
  }

  async function saveBlog(e: any) {
    e.preventDefault();
    setSaving(true);
    try {
      if (blogSelId) await api.updateBlog(blogSelId, blogForm); else await api.createBlog(blogForm);
      await sync(); startNewBlog();
    } catch (err: any) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  }

  async function deleteBlog() {
    if (!blogSelId || !confirm('Delete this post?')) return;
    setSaving(true);
    try { await api.deleteBlog(blogSelId); await sync(); startNewBlog(); }
    finally { setSaving(false); }
  }

  // Get cover image for project thumbnail
  function getCover(p: any) {
    const c = typeof p.content === 'string' ? JSON.parse(p.content) : p.content;
    return c?.find((b: any) => b.type === 'heroImage')?.data?.image || '';
  }

  if (!authed) {
    return (
      <main className="container" style={{ padding: '120px 15px 60px', maxWidth: '460px' }}>
        <h1 style={{ color: '#fff', fontFamily: "'GilroyExtraBold', sans-serif", textAlign: 'center', marginBottom: '30px' }}>Admin Login</h1>
        <form onSubmit={login} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '30px', display: 'grid', gap: '15px' }}>
          <label style={{ display: 'grid', gap: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Username<input value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px' }} /></label>
          <label style={{ display: 'grid', gap: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px' }} /></label>
          {authError && <p style={{ color: '#e74c3c', fontSize: '13px', margin: 0 }}>{authError}</p>}
          <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%' }}>{saving ? 'Signing in...' : 'Sign in'}</button>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'center', margin: 0 }}>Default: admin / admin123</p>
        </form>
      </main>
    );
  }

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'projects', label: '🏠 Projects' },
    { id: 'blog', label: '📝 Blog' },
    { id: 'categories', label: '📁 Categories' },
  ];

  return (
    <main className="container" style={{ padding: '100px 15px 60px' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 18px', borderRadius: '8px', border: tab === t.id ? '1px solid rgba(198,164,123,1)' : '1px solid rgba(255,255,255,0.15)', background: tab === t.id ? 'rgba(198,164,123,0.15)' : 'transparent', color: tab === t.id ? 'rgba(198,164,123,1)' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>{t.label}</button>
          ))}
        </div>
        <button onClick={logout} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px' }}>Logout</button>
      </div>

      {/* ============ DASHBOARD ============ */}
      {tab === 'dashboard' && (
        <div>
          <h2 style={{ color: '#fff', marginBottom: '20px' }}>Dashboard</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            {[{ l: 'Total Projects', v: stats.projectCount, c: '#8c6a4e' }, { l: 'Published', v: stats.publishedCount, c: '#27ae60' }, { l: 'Blog Posts', v: stats.blogCount, c: '#3498db' }, { l: 'Categories', v: stats.categoryCount, c: '#9b59b6' }].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 800, color: s.c, fontFamily: "'GilroyExtraBold', sans-serif" }}>{s.v}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '5px' }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ color: '#fff', margin: '0 0 15px' }}>Recent Projects</h3>
              {adminData.projects?.slice(0, 5).map((p: any) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {getCover(p) && <img src={getCover(p)} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />}
                  <div><div style={{ color: '#fff', fontSize: '14px' }}>{p.title}</div><div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{p.isPublished ? '✓ Published' : '○ Draft'}</div></div>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ color: '#fff', margin: '0 0 15px' }}>Quick Actions</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                <button onClick={() => { setTab('projects'); startNewProject(); }} className="btn-primary" style={{ textAlign: 'left' }}>+ New Project</button>
                <button onClick={() => { setTab('blog'); startNewBlog(); }} className="btn-primary" style={{ textAlign: 'left' }}>+ New Blog Post</button>
                <button onClick={() => setTab('categories')} className="btn-primary" style={{ textAlign: 'left' }}>Manage Categories</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ PROJECTS ============ */}
      {tab === 'projects' && (
        <div style={{ display: 'grid', gridTemplateColumns: selId ? '280px 1fr' : '1fr', gap: '20px' }}>
          {/* List */}
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>Projects</h3>
              <button onClick={startNewProject} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>+ New</button>
            </div>
            {adminData.projects?.map((p: any) => (
              <div key={p.id} onClick={() => startEditProject(p)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', cursor: 'pointer', background: selId === p.id ? 'rgba(198,164,123,0.15)' : 'transparent', marginBottom: '4px', transition: 'background 0.2s' }}>
                {getCover(p) ? <img src={getCover(p)} alt="" style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }} /> : <div style={{ width: '44px', height: '44px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)' }} />}
                <div style={{ minWidth: 0 }}><div style={{ color: '#fff', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div><div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{p.cityName || ''} {p.year ? `(${p.year})` : ''}</div></div>
                <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: p.isPublished ? '#27ae60' : '#e74c3c', flexShrink: 0 }} />
              </div>
            ))}
          </div>

          {/* Editor */}
          {form && (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', maxHeight: '80vh', overflow: 'auto' }}>
              <h3 style={{ color: '#fff', margin: '0 0 15px', fontSize: '16px' }}>{selId ? 'Edit Project' : 'New Project'}</h3>
              <form onSubmit={saveProject} style={{ display: 'grid', gap: '12px' }}>
                {/* Basic */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Title<input value={form.title} onChange={(e) => changeProject('title', e.target.value)} required style={inputStyle} /></label>
                  <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Slug<input value={form.slug} onChange={(e) => changeProject('slug', e.target.value)} style={inputStyle} /></label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Category<select value={form.categoryId} onChange={(e) => changeProject('categoryId', e.target.value)} required style={inputStyle}>{adminData.categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                  <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>City<input value={form.cityName} onChange={(e) => changeProject('cityName', e.target.value)} placeholder="e.g. San Francisco" style={inputStyle} /></label>
                  <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Year<input type="number" value={form.year} onChange={(e) => changeProject('year', e.target.value)} placeholder="2024" style={inputStyle} /></label>
                </div>

                {/* Toggles */}
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px' }}><input type="checkbox" checked={form.isFeatured} onChange={(e) => changeProject('isFeatured', e.target.checked)} /> Featured</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px' }}><input type="checkbox" checked={form.isPublished} onChange={(e) => changeProject('isPublished', e.target.checked)} /> Published</label>
                </div>

                {/* SEO Accordion */}
                <details style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px' }}>
                  <summary style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600 }}>SEO Settings</summary>
                  <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
                    <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>SEO Title<input value={form.seoTitle} onChange={(e) => changeProject('seoTitle', e.target.value)} style={inputStyle} /></label>
                    <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>SEO Description<textarea rows={2} value={form.seoDescription} onChange={(e) => changeProject('seoDescription', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></label>
                    <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Keywords (comma separated)<input value={form.seoKeywords} onChange={(e) => changeProject('seoKeywords', e.target.value)} style={inputStyle} /></label>
                  </div>
                </details>

                {/* Block Builder */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px' }}>
                  <h4 style={{ color: '#fff', margin: '0 0 10px', fontSize: '14px' }}>Content Blocks</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                    {BLOCK_TYPES.map((bt) => <button key={bt.value} type="button" onClick={() => addBlock(bt.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '11px' }}>{bt.label}</button>)}
                  </div>

                  {(form.content || []).map((block: any, i: number) => (
                    <div key={block.id || i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>{block.type}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0} style={miniBtn}>↑</button>
                          <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === (form.content || []).length - 1} style={miniBtn}>↓</button>
                          <button type="button" onClick={() => removeBlock(i)} style={{ ...miniBtn, color: '#e74c3c' }}>✕</button>
                        </div>
                      </div>
                      <BlockEditor block={block} idx={i} onUpdate={updateBlock} onUpload={uploadToBlock} formTitle={form.title} />
                    </div>
                  ))}
                  {(!form.content || !form.content.length) && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '15px', margin: 0 }}>Click a block type above to start building</p>}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save Project'}</button>
                  {selId && <button type="button" onClick={deleteProject} style={{ ...miniBtn, padding: '10px 20px', background: '#e74c3c', border: 'none' }}>Delete</button>}
                </div>
              </form>
            </div>
          )}
          {!form && <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}><p>Select a project or click + New to start</p></div>}
        </div>
      )}

      {/* ============ BLOG ============ */}
      {tab === 'blog' && (
        <div style={{ display: 'grid', gridTemplateColumns: blogSelId ? '280px 1fr' : '1fr', gap: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>Blog Posts</h3>
              <button onClick={startNewBlog} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>+ New</button>
            </div>
            {adminData.blogPosts?.map((p: any) => (
              <div key={p.id} onClick={() => startEditBlog(p)} style={{ padding: '10px', borderRadius: '8px', cursor: 'pointer', background: blogSelId === p.id ? 'rgba(198,164,123,0.15)' : 'transparent', marginBottom: '4px' }}>
                <div style={{ color: '#fff', fontSize: '13px' }}>{p.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{p.isPublished ? '✓ Published' : '○ Draft'}</div>
              </div>
            ))}
          </div>
          {blogForm && (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', maxHeight: '80vh', overflow: 'auto' }}>
              <h3 style={{ color: '#fff', margin: '0 0 15px', fontSize: '16px' }}>{blogSelId ? 'Edit Post' : 'New Post'}</h3>
              <form onSubmit={saveBlog} style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Title<input value={blogForm.title} onChange={(e) => changeBlog('title', e.target.value)} required style={inputStyle} /></label>
                  <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Slug<input value={blogForm.slug} onChange={(e) => changeBlog('slug', e.target.value)} style={inputStyle} /></label>
                </div>
                <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Excerpt<textarea rows={2} value={blogForm.excerpt} onChange={(e) => changeBlog('excerpt', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></label>
                <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Content (HTML)<textarea rows={12} value={blogForm.content} onChange={(e) => changeBlog('content', e.target.value)} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }} /></label>
                <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Cover Image URL<input value={blogForm.coverImage} onChange={(e) => changeBlog('coverImage', e.target.value)} style={inputStyle} /></label>
                <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Upload Cover<input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => { if (!e.target.files?.[0]) return; setSaving(true); try { const r = await api.uploadImage(e.target.files[0], blogForm.title); changeBlog('coverImage', r.url); } catch (err: any) { alert(err.message); } finally { setSaving(false); } }} style={inputStyle} /></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px' }}><input type="checkbox" checked={blogForm.isPublished} onChange={(e) => changeBlog('isPublished', e.target.checked)} /> Published</label>
                <details style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px' }}>
                  <summary style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>SEO</summary>
                  <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
                    <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>SEO Title<input value={blogForm.seoTitle} onChange={(e) => changeBlog('seoTitle', e.target.value)} style={inputStyle} /></label>
                    <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>SEO Description<textarea rows={2} value={blogForm.seoDescription} onChange={(e) => changeBlog('seoDescription', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></label>
                    <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Tags (comma separated)<input value={blogForm.tags} onChange={(e) => changeBlog('tags', e.target.value)} style={inputStyle} /></label>
                  </div>
                </details>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save Post'}</button>
                  {blogSelId && <button type="button" onClick={deleteBlog} style={{ ...miniBtn, padding: '10px 20px', background: '#e74c3c', border: 'none' }}>Delete</button>}
                </div>
              </form>
            </div>
          )}
          {!blogForm && <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}><p>Select a post or click + New</p></div>}
        </div>
      )}

      {/* ============ CATEGORIES ============ */}
      {tab === 'categories' && (
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#fff', margin: '0 0 20px' }}>Categories</h3>
          {adminData.categories?.map((c: any) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '8px' }}>
              <div><div style={{ color: '#fff', fontSize: '15px' }}>{c.name}</div><div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>/{c.slug}</div></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                <input type="checkbox" checked={c.showInHeader} onChange={async (e) => { try { await api.updateCategory(c.id, { showInHeader: e.target.checked }); await sync(); } catch (err: any) { alert(err.message); } }} />
                Show in header
              </label>
            </div>
          ))}
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>Loading...</div>}
    </main>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', fontFamily: 'inherit' };
const miniBtn: React.CSSProperties = { padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '12px' };

function BlockEditor({ block, idx, onUpdate, onUpload, formTitle }: { block: any; idx: number; onUpdate: (i: number, f: string, v: any) => void; onUpload: (i: number, f: string, file: File) => void; formTitle: string }) {
  const { type, data } = block;
  const field = (label: string, field: string, opts: any = {}) => (
    <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '6px' }}>
      {label}
      {opts.textarea ? <textarea rows={opts.rows || 3} value={data[field] || ''} onChange={(e) => onUpdate(idx, field, e.target.value)} style={{ ...inputStyle, resize: 'vertical', fontFamily: opts.mono ? 'monospace' : 'inherit' }} /> :
        opts.select ? <select value={data[field] || opts.default || ''} onChange={(e) => onUpdate(idx, field, e.target.value)} style={inputStyle}>{opts.options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> :
        <input type={opts.type || 'text'} value={data[field] || ''} onChange={(e) => onUpdate(idx, field, e.target.value)} style={inputStyle} />}
    </label>
  );

  const uploadField = (label: string, field: string) => (
    <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '6px' }}>
      {label}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { if (e.target.files?.[0]) onUpload(idx, field, e.target.files[0]); }} style={{ ...inputStyle, padding: '6px' }} />
    </label>
  );

  if (type === 'heroImage') return <>{field('Title', 'title')}{field('Subtitle', 'subtitle')}{field('Image URL', 'image')}{uploadField('Upload Image', 'image')}{field('Alt Text', 'alt')}</>;
  if (type === 'imageGrid') return (<>
    <div style={{ display: 'grid', gap: '6px', marginBottom: '8px' }}>
      {((data.images || []) as any[]).map((img: any, gi: number) => (
        <div key={gi} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {typeof img === 'object' && img.url && <img src={img.url} alt="" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />}
          {typeof img === 'string' && <img src={img} alt="" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />}
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{typeof img === 'string' ? img : img.url}</span>
          <button type="button" onClick={() => { const arr = [...(data.images || [])]; arr.splice(gi, 1); onUpdate(idx, 'images', arr); }} style={miniBtn}>✕</button>
        </div>
      ))}
    </div>
    <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '6px' }}>
      Image URLs (one per line)
      <textarea rows={3} value={(data.images || []).map((im: any) => typeof im === 'string' ? im : im.url).join('\n')}
        onChange={(e) => { const urls = e.target.value.split('\n').filter(Boolean); onUpdate(idx, 'images', urls.map((u) => ({ url: u, alt: formTitle }))); }}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }} />
    </label>
    <label style={{ display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '6px' }}>Upload Images<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={async (e) => { if (!e.target.files?.length) return; for (const f of Array.from(e.target.files)) { try { const r = await onUpload(idx, 'imageUpload', f as File); const existing = [...(data.images || [])]; existing.push({ url: r.url, alt: formTitle }); onUpdate(idx, 'images', existing); } catch (err: any) { alert(err.message); } } }} style={{ ...inputStyle, padding: '6px' }} /></label>
    {field('Columns', 'columns', { select: true, options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }], default: 2 })}
  </>);
  if (type === 'metaInfo') return <>{field('Items (label: value, one per line)', 'metaText', { textarea: true })}</>;
  if (type === 'typography') return <>{field('Title', 'title')}{field('Content', 'content', { textarea: true, rows: 5 })}{field('Size', 'size', { select: true, options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }], default: 'md' })}</>;
  if (type === 'sideBySide') return <>{field('Title', 'title')}{field('Text', 'text', { textarea: true, rows: 4 })}{field('Image URL', 'image')}{uploadField('Upload', 'image')}{field('Position', 'imagePosition', { select: true, options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }], default: 'left' })}</>;
  if (type === 'ctaSection') return <>{field('Title', 'title')}{field('Text', 'text', { textarea: true })}{field('Button Text', 'buttonText')}{field('Button Link', 'buttonLink')}</>;
  if (type === 'beforeAfter') return <>{field('Title', 'title')}{field('Before URL', 'beforeImage')}{uploadField('Upload Before', 'beforeImage')}{field('After URL', 'afterImage')}{uploadField('Upload After', 'afterImage')}</>;
  return <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>No fields for this block type</p>;
}
