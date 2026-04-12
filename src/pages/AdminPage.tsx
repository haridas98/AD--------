import React, { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../lib/api';

const BLOCK_TYPES = [
  { value: 'heroImage', label: '📸 Hero Image' },
  { value: 'imageGrid', label: '🖼️ Image Grid' },
  { value: 'metaInfo', label: 'ℹ️ Meta Info' },
  { value: 'typography', label: '📝 Typography' },
  { value: 'sideBySide', label: '↔️ Side by Side' },
  { value: 'ctaSection', label: '📣 CTA Section' },
  { value: 'beforeAfter', label: '🔄 Before / After' },
];

function toSlug(t: string) {
  if (!t) return '';
  return t.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', fontFamily: 'inherit' };
const miniBtn: React.CSSProperties = { padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '12px' };
const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px' };

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

  // Project
  const [selId, setSelId] = useState('');
  const [form, setForm] = useState<any>(null);

  // Blog
  const [blogSelId, setBlogSelId] = useState('');
  const [blogForm, setBlogForm] = useState<any>(null);
  const [blogContent, setBlogContent] = useState('');

  async function sync() {
    setLoading(true);
    try {
      const p1 = api.getAdminContent();
      const p2 = api.getStats().catch(() => ({ projectCount: 0, publishedCount: 0, blogCount: 0, categoryCount: 0 }));
      const [content, s] = await Promise.all([p1, p2]);
      setAdminData(content);
      setStats(s);
    } catch { api.clearToken(); setAuthed(false); setAuthError('Session expired'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (authed) sync(); }, [authed]);

  async function login(e: any) {
    e.preventDefault(); setSaving(true);
    try { await api.login(username, password); setAuthed(true); setPassword(''); await sync(); }
    catch { setAuthError('Wrong credentials'); api.clearToken(); }
    finally { setSaving(false); }
  }

  async function logout() { await api.logout(); setAuthed(false); setSelId(''); setForm(null); setBlogSelId(''); setBlogForm(null); }

  // ===== PROJECT =====
  function newProject() {
    setSelId('');
    const c = adminData.categories?.[0];
    setForm({ title: '', slug: '', categoryId: c?.id || '', content: [], isFeatured: false, isPublished: true, seoTitle: '', seoDescription: '', seoKeywords: '', cityName: '', year: '' });
  }

  function editProject(p: any) {
    setSelId(p.id);
    const ct = typeof p.content === 'string' ? JSON.parse(p.content) : p.content;
    setForm({ title: p.title || '', slug: p.slug || '', categoryId: p.categoryId || '', content: ct || [], isFeatured: !!p.isFeatured, isPublished: p.isPublished !== false, seoTitle: p.seoTitle || '', seoDescription: p.seoDescription || '', seoKeywords: p.seoKeywords || '', cityName: p.cityName || '', year: p.year || '' });
  }

  function setF(field: string, value: any) {
    setForm((prev: any) => {
      const n = { ...prev, [field]: value };
      if (field === 'title' && !prev.slug) n.slug = toSlug(value);
      return n;
    });
  }

  function addBlock(type: string) {
    setForm((prev: any) => ({ ...prev, content: [...(prev.content || []), { type, data: {}, id: Date.now().toString() }] }));
  }
  function rmBlock(i: number) { setForm((prev: any) => ({ ...prev, content: (prev.content || []).filter((_: any, j: number) => j !== i) })); }
  function mvBlock(i: number, d: number) {
    setForm((prev: any) => {
      const a = [...(prev.content || [])]; const ni = i + d;
      if (ni < 0 || ni >= a.length) return prev;
      [a[i], a[ni]] = [a[ni], a[i]];
      return { ...prev, content: a };
    });
  }
  function setBlock(i: number, f: string, v: any) {
    setForm((prev: any) => {
      const a = [...(prev.content || [])];
      a[i] = { ...a[i], data: { ...a[i].data, [f]: v } };
      return { ...prev, content: a };
    });
  }

  async function uploadBlockImg(blockIdx: number, field: string, file: File) {
    if (!file) return;
    setSaving(true);
    try {
      const r = await api.uploadImage(file, form.title, `${blockIdx}-${field}`);
      setBlock(blockIdx, field, r.url);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function saveProject(e: any) {
    e.preventDefault(); setSaving(true);
    try {
      const p = { ...form, content: JSON.stringify(form.content || []) };
      if (selId) await api.updateProject(selId, p); else await api.createProject(p);
      await sync(); await refresh(); newProject();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  }

  async function deleteProject() {
    if (!selId || !confirm('Delete this project?')) return;
    setSaving(true);
    try { await api.deleteProject(selId); await sync(); await refresh(); newProject(); }
    finally { setSaving(false); }
  }

  // ===== BLOG =====
  function newBlog() { setBlogSelId(''); setBlogForm({ title: '', slug: '', excerpt: '', content: '', coverImage: '', isPublished: false, seoTitle: '', seoDescription: '', seoKeywords: '', tags: '' }); setBlogContent(''); }

  function editBlog(p: any) {
    setBlogSelId(p.id);
    setBlogForm({ title: p.title || '', slug: p.slug || '', excerpt: p.excerpt || '', content: p.content || '', coverImage: p.coverImage || '', isPublished: !!p.isPublished, seoTitle: p.seoTitle || '', seoDescription: p.seoDescription || '', seoKeywords: p.seoKeywords || '', tags: p.tags || '' });
    setBlogContent(p.content || '');
  }

  function setBF(field: string, value: any) {
    setBlogForm((prev: any) => { const n = { ...prev, [field]: value }; if (field === 'title' && !prev.slug) n.slug = toSlug(value); return n; });
  }

  async function saveBlog(e: any) {
    e.preventDefault(); setSaving(true);
    try {
      const p = { ...blogForm, content: blogContent };
      if (blogSelId) await api.updateBlog(blogSelId, p); else await api.createBlog(p);
      await sync(); newBlog();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  }

  async function deleteBlog() {
    if (!blogSelId || !confirm('Delete this post?')) return;
    setSaving(true);
    try { await api.deleteBlog(blogSelId); await sync(); newBlog(); }
    finally { setSaving(false); }
  }

  function getCover(p: any) {
    const c = typeof p.content === 'string' ? JSON.parse(p.content) : p.content;
    return c?.find((b: any) => b.type === 'heroImage')?.data?.image || '';
  }

  // ===== LOGIN SCREEN =====
  if (!authed) {
    return (
      <main className="container" style={{ padding: '120px 15px 60px', maxWidth: '460px' }}>
        <h1 style={{ color: '#fff', fontFamily: "'GilroyExtraBold', sans-serif", textAlign: 'center', marginBottom: '30px' }}>Admin Login</h1>
        <form onSubmit={login} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '30px', display: 'grid', gap: '15px' }}>
          <label style={{ display: 'grid', gap: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Username<input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} /></label>
          <label style={{ display: 'grid', gap: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} /></label>
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
    <main className="container" style={{ padding: '100px 15px 60px', maxWidth: '1400px' }}>
      {/* Tabs */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#141414', paddingBottom: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 18px', borderRadius: '8px', border: tab === t.id ? '1px solid rgba(198,164,123,1)' : '1px solid rgba(255,255,255,0.15)', background: tab === t.id ? 'rgba(198,164,123,0.15)' : 'transparent', color: tab === t.id ? 'rgba(198,164,123,1)' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s', fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</button>
            ))}
          </div>
          <button onClick={logout} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px' }}>Logout</button>
        </div>
      </div>

      {/* ========== DASHBOARD ========== */}
      {tab === 'dashboard' && (
        <div>
          <h2 style={{ color: '#fff', marginBottom: '20px' }}>Dashboard</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
            {[{ l: 'Total Projects', v: stats.projectCount, c: '#8c6a4e' }, { l: 'Published', v: stats.publishedCount, c: '#27ae60' }, { l: 'Blog Posts', v: stats.blogCount, c: '#3498db' }, { l: 'Categories', v: stats.categoryCount, c: '#9b59b6' }].map((s, i) => (
              <div key={i} style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 800, color: s.c, fontFamily: "'GilroyExtraBold', sans-serif" }}>{s.v}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '5px' }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={cardStyle}>
              <h3 style={{ color: '#fff', margin: '0 0 15px' }}>Recent Projects</h3>
              {adminData.projects?.slice(0, 5).map((p: any) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {getCover(p) && <img src={getCover(p)} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />}
                  <div><div style={{ color: '#fff', fontSize: '14px' }}>{p.title}</div><div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{p.isPublished ? '✓ Published' : '○ Draft'}{p.cityName ? ` • ${p.cityName}` : ''}</div></div>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <h3 style={{ color: '#fff', margin: '0 0 15px' }}>Quick Actions</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                <button onClick={() => { setTab('projects'); newProject(); }} className="btn-primary" style={{ textAlign: 'left' }}>+ New Project</button>
                <button onClick={() => { setTab('blog'); newBlog(); }} className="btn-primary" style={{ textAlign: 'left' }}>+ New Blog Post</button>
                <button onClick={() => setTab('categories')} className="btn-primary" style={{ textAlign: 'left' }}>Manage Categories</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== PROJECTS ========== */}
      {tab === 'projects' && (
        <div>
          {/* Action bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '18px' }}>{form ? 'Editing Project' : 'Projects'}</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              {form && <button onClick={() => { setSelId(''); setForm(null); }} style={{ ...miniBtn, padding: '8px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>← Back to List</button>}
              {!form && <button onClick={newProject} className="btn-primary">+ New Project</button>}
            </div>
          </div>

          {/* Project list — only when not editing */}
          {!form && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', marginBottom: '30px' }}>
              {adminData.projects?.map((p: any) => (
                <div key={p.id} onClick={() => editProject(p)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(198,164,123,0.1)'; e.currentTarget.style.borderColor = 'rgba(198,164,123,0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  {getCover(p) ? <img src={getCover(p)} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{p.cityName || ''} {p.year ? `(${p.year})` : ''}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: p.isPublished ? 'rgba(39,174,96,0.2)' : 'rgba(231,76,60,0.2)', color: p.isPublished ? '#27ae60' : '#e74c3c' }}>{p.isPublished ? 'Published' : 'Draft'}</span>
                      {p.isFeatured && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(140,106,78,0.2)', color: '#8c6a4e' }}>Featured</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Editor — only when form is open */}
          {form && (
            <div style={{ ...cardStyle, maxHeight: '80vh', overflow: 'auto' }}>
              <h3 style={{ color: '#fff', margin: '0 0 15px', fontSize: '16px' }}>{selId ? 'Edit Project' : 'New Project'}</h3>
              <form onSubmit={saveProject} style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={labelStyle}>Title<input value={form.title} onChange={(e) => setF('title', e.target.value)} required style={inputStyle} /></label>
                  <label style={labelStyle}>Slug<input value={form.slug} onChange={(e) => setF('slug', e.target.value)} style={inputStyle} placeholder="auto-generated" /></label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <label style={labelStyle}>Category<select value={form.categoryId} onChange={(e) => setF('categoryId', e.target.value)} required style={inputStyle}>{adminData.categories?.map((c: any) => <option key={c.id} value={c.id} style={{ background: '#141414' }}>{c.name}</option>)}</select></label>
                  <label style={labelStyle}>City<input value={form.cityName} onChange={(e) => setF('cityName', e.target.value)} placeholder="San Francisco" style={inputStyle} /></label>
                  <label style={labelStyle}>Year<input type="number" value={form.year} onChange={(e) => setF('year', e.target.value)} placeholder="2024" style={inputStyle} /></label>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px' }}><input type="checkbox" checked={form.isFeatured} onChange={(e) => setF('isFeatured', e.target.checked)} /> Featured</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px' }}><input type="checkbox" checked={form.isPublished} onChange={(e) => setF('isPublished', e.target.checked)} /> Published</label>
                </div>

                {/* SEO */}
                <details style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px' }}>
                  <summary style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600 }}>SEO Settings</summary>
                  <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
                    <label style={labelStyle}>SEO Title<input value={form.seoTitle} onChange={(e) => setF('seoTitle', e.target.value)} style={inputStyle} /></label>
                    <label style={labelStyle}>SEO Description<textarea rows={2} value={form.seoDescription} onChange={(e) => setF('seoDescription', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></label>
                    <label style={labelStyle}>Keywords<input value={form.seoKeywords} onChange={(e) => setF('seoKeywords', e.target.value)} placeholder="interior, kitchen, SF" style={inputStyle} /></label>
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
                          <button type="button" onClick={() => mvBlock(i, -1)} disabled={i === 0} style={miniBtn}>↑</button>
                          <button type="button" onClick={() => mvBlock(i, 1)} disabled={i === (form.content || []).length - 1} style={miniBtn}>↓</button>
                          <button type="button" onClick={() => rmBlock(i)} style={{ ...miniBtn, color: '#e74c3c' }}>✕</button>
                        </div>
                      </div>
                      <BlockEditor block={block} idx={i} onUpdate={setBlock} onUpload={uploadBlockImg} formTitle={form.title} />
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
          {!form && adminData.projects?.length === 0 && <div style={{ ...cardStyle, textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '60px' }}><p>No projects yet. Click + New Project to get started.</p></div>}
        </div>
      )}

      {/* ========== BLOG ========== */}
      {tab === 'blog' && (
        <div style={{ display: 'grid', gridTemplateColumns: blogSelId ? '300px 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
          <div style={{ ...cardStyle, maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>Blog Posts</h3>
              <button onClick={newBlog} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>+ New</button>
            </div>
            {adminData.blogPosts?.map((p: any) => (
              <div key={p.id} onClick={() => editBlog(p)} style={{ padding: '10px', borderRadius: '8px', cursor: 'pointer', background: blogSelId === p.id ? 'rgba(198,164,123,0.15)' : 'transparent', marginBottom: '4px' }}>
                <div style={{ color: '#fff', fontSize: '13px' }}>{p.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{p.isPublished ? '✓ Published' : '○ Draft'}</div>
              </div>
            ))}
          </div>
          {blogForm && (
            <div style={{ ...cardStyle, maxHeight: '80vh', overflow: 'auto' }}>
              <h3 style={{ color: '#fff', margin: '0 0 15px', fontSize: '16px' }}>{blogSelId ? 'Edit Post' : 'New Post'}</h3>
              <form onSubmit={saveBlog} style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={labelStyle}>Title<input value={blogForm.title} onChange={(e) => setBF('title', e.target.value)} required style={inputStyle} /></label>
                  <label style={labelStyle}>Slug<input value={blogForm.slug} onChange={(e) => setBF('slug', e.target.value)} style={inputStyle} placeholder="auto" /></label>
                </div>
                <label style={labelStyle}>Excerpt<textarea rows={2} value={blogForm.excerpt} onChange={(e) => setBF('excerpt', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} /></label>

                {/* React Quill Editor */}
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
                      formats={[
                        'header', 'bold', 'italic', 'underline', 'strike',
                        'color', 'background', 'list', 'bullet', 'align',
                        'blockquote', 'code-block', 'link', 'image', 'video',
                      ]}
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', minHeight: '300px' }}
                    />
                  </div>
                </div>

                <label style={labelStyle}>Cover Image URL<input value={blogForm.coverImage} onChange={(e) => setBF('coverImage', e.target.value)} style={inputStyle} /></label>
                <label style={labelStyle}>Upload Cover<input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => { if (!e.target.files?.[0]) return; setSaving(true); try { const r = await api.uploadImage(e.target.files[0], blogForm.title); setBF('coverImage', r.url); } catch (err: any) { alert(err.message); } finally { setSaving(false); } }} style={{ ...inputStyle, padding: '6px' }} /></label>
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
                  {blogSelId && <button type="button" onClick={deleteBlog} style={{ ...miniBtn, padding: '10px 20px', background: '#e74c3c', border: 'none' }}>Delete</button>}
                </div>
              </form>
            </div>
          )}
          {!blogForm && <div style={{ ...cardStyle, textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '60px' }}><p>Select a post or click + New</p></div>}
        </div>
      )}

      {/* ========== CATEGORIES ========== */}
      {tab === 'categories' && (
        <div style={cardStyle}>
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

const labelStyle: React.CSSProperties = { display: 'grid', gap: '4px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' };

function BlockEditor({ block, idx, onUpdate, onUpload, formTitle }: { block: any; idx: number; onUpdate: (i: number, f: string, v: any) => void; onUpload: (i: number, f: string, file: File) => void; formTitle: string }) {
  const { data } = block;
  const field = (label: string, f: string, opts: any = {}) => (
    <label style={labelStyle}>
      {label}
      {opts.textarea ? <textarea rows={opts.rows || 3} value={data[f] || ''} onChange={(e) => onUpdate(idx, f, e.target.value)} style={{ ...inputStyle, resize: 'vertical', fontFamily: opts.mono ? 'monospace' : 'inherit' }} /> :
        opts.select ? <select value={data[f] || opts.default || ''} onChange={(e) => onUpdate(idx, f, e.target.value)} style={inputStyle}>{opts.options.map((o: any) => <option key={o.value} value={o.value} style={{ background: '#141414' }}>{o.label}</option>)}</select> :
        <input type={opts.type || 'text'} value={data[f] || ''} onChange={(e) => onUpdate(idx, f, e.target.value)} style={inputStyle} />}
    </label>
  );

  const uploadField = (label: string, f: string) => (
    <label style={labelStyle}>
      {label}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { if (e.target.files?.[0]) onUpload(idx, f, e.target.files[0]); }} style={{ ...inputStyle, padding: '6px' }} />
    </label>
  );

  if (block.type === 'heroImage') return <>{field('Title', 'title')}{field('Subtitle', 'subtitle')}{field('Image URL', 'image')}{uploadField('Upload Image', 'image')}{field('Alt Text', 'alt')}</>;

  if (block.type === 'imageGrid') return (<>
    <div style={{ display: 'grid', gap: '6px', marginBottom: '8px' }}>
      {((data.images || []) as any[]).map((img: any, gi: number) => (
        <div key={gi} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(typeof img === 'object' ? img.url : img) && <img src={typeof img === 'object' ? img.url : img} alt="" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />}
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{typeof img === 'string' ? img : img.url}</span>
          <button type="button" onClick={() => { const a = [...(data.images || [])]; a.splice(gi, 1); onUpdate(idx, 'images', a); }} style={miniBtn}>✕</button>
        </div>
      ))}
    </div>
    <label style={labelStyle}>
      Image URLs (one per line)
      <textarea rows={3} value={(data.images || []).map((im: any) => typeof im === 'string' ? im : im.url).join('\n')}
        onChange={(e) => { const urls = e.target.value.split('\n').filter(Boolean); onUpdate(idx, 'images', urls.map((u) => ({ url: u, alt: formTitle }))); }}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }} />
    </label>
    <label style={labelStyle}>Upload Images<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={async (e) => { if (!e.target.files?.length) return; for (const f of Array.from(e.target.files)) { try { const r = await onUpload(idx, 'imageUpload', f as File); const a = [...(data.images || [])]; a.push({ url: r.url, alt: formTitle }); onUpdate(idx, 'images', a); } catch (err: any) { alert(err.message); } } }} style={{ ...inputStyle, padding: '6px' }} /></label>
    {field('Columns', 'columns', { select: true, options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }], default: 2 })}
  </>);

  if (block.type === 'metaInfo') return <>{field('Items (label: value, one per line)', 'metaText', { textarea: true })}</>;
  if (block.type === 'typography') return <>{field('Title', 'title')}{field('Content', 'content', { textarea: true, rows: 5 })}{field('Size', 'size', { select: true, options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }], default: 'md' })}</>;
  if (block.type === 'sideBySide') return <>{field('Title', 'title')}{field('Text', 'text', { textarea: true, rows: 4 })}{field('Image URL', 'image')}{uploadField('Upload', 'image')}{field('Position', 'imagePosition', { select: true, options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }], default: 'left' })}</>;
  if (block.type === 'ctaSection') return <>{field('Title', 'title')}{field('Text', 'text', { textarea: true })}{field('Button Text', 'buttonText')}{field('Button Link', 'buttonLink')}</>;
  if (block.type === 'beforeAfter') return <>{field('Title', 'title')}{field('Before URL', 'beforeImage')}{uploadField('Upload Before', 'beforeImage')}{field('After URL', 'afterImage')}{uploadField('Upload After', 'afterImage')}</>;
  return <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>No fields</p>;
}
