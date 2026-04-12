import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../lib/api.js';
import type { ContentData, Project, Category } from '../types';

const EMPTY = {
  id: '',
  title: '',
  slug: '',
  categoryId: '',
  location: '',
  year: '',
  coverImage: '',
  galleryText: '',
  summary: '',
  workDone: '',
  featuredOnHome: false,
  published: true
};

interface AdminPageProps {
  data: {
    projects: Project[];
    categories: Category[];
  };
  refresh: () => Promise<void>;
}

function toForm(project: Project | null) {
  if (!project) return { ...EMPTY };
  return {
    ...project,
    galleryText: (project.gallery || []).join('\n')
  };
}

export default function AdminPage({ data, refresh }: AdminPageProps) {
  const [authed, setAuthed] = useState(!!api.getStoredToken());
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ ...EMPTY, categoryId: data.categories[0]?.id || '' });
  const [saving, setSaving] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [adminData, setAdminData] = useState(data);
  const [featuredSet, setFeaturedSet] = useState(new Set(data.projects.filter((p) => p.featuredOnHome).map((p) => p.id)));

  const selectedProject = useMemo(
    () => adminData.projects.find((p) => p.id === selectedId),
    [adminData.projects, selectedId]
  );

  async function syncAdminData() {
    setLoadingAdmin(true);
    try {
      const payload = await api.getAdminContent();
      setAdminData(payload);
      setFeaturedSet(new Set(payload.projects.filter((p) => p.featuredOnHome).map((p) => p.id)));
    } catch {
      api.clearToken();
      setAuthed(false);
      setAuthError('Session expired. Please sign in again.');
    } finally {
      setLoadingAdmin(false);
    }
  }

  useEffect(() => {
    if (authed) {
      syncAdminData();
    }
  }, [authed]);

  async function login(e: React.FormEvent) {
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
      setForm({ ...EMPTY, categoryId: adminData.categories[0]?.id || '' });
    } finally {
      setSaving(false);
    }
  }

  function startNew() {
    setSelectedId('');
    setForm({ ...EMPTY, categoryId: adminData.categories[0]?.id || '' });
  }

  function startEdit(project: Project) {
    setSelectedId(project.id);
    setForm(toForm(project));
  }

  function change(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function uploadCover(file: File) {
    if (!file) return;
    setSaving(true);
    try {
      const result = await api.uploadImage(file);
      change('coverImage', result.url);
    } finally {
      setSaving(false);
    }
  }

  async function uploadGalleryFiles(files: FileList) {
    if (!files?.length) return;
    setSaving(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const result = await api.uploadImage(file);
        urls.push(result.url);
      }
      const merged = [
        ...form.galleryText.split('\n').map((x: string) => x.trim()).filter(Boolean),
        ...urls
      ];
      change('galleryText', merged.join('\n'));
    } finally {
      setSaving(false);
    }
  }

  async function saveProject(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        gallery: form.galleryText.split('\n').map((x: string) => x.trim()).filter(Boolean)
      };

      if (selectedId) await api.updateProject(selectedId, payload);
      else await api.createProject(payload);

      await syncAdminData();
      await refresh();
      startNew();
    } finally {
      setSaving(false);
    }
  }

  async function removeProject() {
    if (!selectedId) return;
    const ok = window.confirm('Delete this project?');
    if (!ok) return;
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

  async function saveFeatured() {
    setSaving(true);
    try {
      await api.saveHomeFeatured(Array.from(featuredSet));
      await syncAdminData();
      await refresh();
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
          <p className="admin-note">Default login: <code>admin</code> / <code>admin123</code></p>
        </form>
      </main>
    );
  }

  return (
    <main className="container page-pad admin-page">
      <div className="admin-header-row">
        <div>
          <h1>Admin</h1>
          <p className="admin-note">Manage projects, upload local images as JPG, and choose homepage featured projects.</p>
        </div>
        <button className="btn-secondary" onClick={logout} disabled={saving}>Logout</button>
      </div>

      <div className="admin-grid">
        <section className="admin-panel reveal is-visible">
          <div className="admin-panel-head">
            <h2>Projects</h2>
            <button className="btn-secondary" onClick={startNew}>+ New</button>
          </div>
          <div className="admin-list">
            {adminData.projects.map((project) => (
              <button
                type="button"
                key={project.id}
                className={`admin-list-item ${selectedId === project.id ? 'active' : ''}`}
                onClick={() => startEdit(project)}
              >
                <span>{project.title}</span>
                <small>{project.categoryId}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="admin-panel reveal is-visible">
          <h2>{selectedProject ? 'Edit project' : 'Add project'}</h2>
          <form className="admin-form" onSubmit={saveProject}>
            <label>Title<input value={form.title} onChange={(e) => change('title', e.target.value)} required /></label>
            <label>Slug<input value={form.slug} onChange={(e) => change('slug', e.target.value)} placeholder="auto if empty" /></label>
            <label>
              Category
              <select value={form.categoryId} onChange={(e) => change('categoryId', e.target.value)} required>
                {adminData.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>Cover image URL<input value={form.coverImage} onChange={(e) => change('coverImage', e.target.value)} /></label>
            <label>
              Upload cover image (saved as JPG)
              <input type="file" accept="image/*" onChange={(e) => uploadCover(e.target.files?.[0]!)} />
            </label>
            <label>Location<input value={form.location} onChange={(e) => change('location', e.target.value)} /></label>
            <label>Year<input value={form.year} onChange={(e) => change('year', e.target.value)} /></label>
            <label>Short summary<textarea rows={3} value={form.summary} onChange={(e) => change('summary', e.target.value)} /></label>
            <label>What was done<textarea rows={4} value={form.workDone} onChange={(e) => change('workDone', e.target.value)} /></label>
            <label>Gallery URLs (one per line)<textarea rows={4} value={form.galleryText} onChange={(e) => change('galleryText', e.target.value)} /></label>
            <label>
              Upload gallery images (saved as JPG)
              <input type="file" accept="image/*" multiple onChange={(e) => uploadGalleryFiles(e.target.files!)} />
            </label>
            <label className="check"><input type="checkbox" checked={!!form.featuredOnHome} onChange={(e) => change('featuredOnHome', e.target.checked)} /> Featured on home</label>
            <label className="check"><input type="checkbox" checked={!!form.published} onChange={(e) => change('published', e.target.checked)} /> Published</label>
            <div className="form-actions">
              <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save project'}</button>
              {selectedId ? <button type="button" className="btn-danger" onClick={removeProject}>Delete</button> : null}
            </div>
          </form>
        </section>

        <section className="admin-panel reveal is-visible">
          <h2>Home page featured projects</h2>
          <p className="admin-note">Pick projects that will be shown in each section on the main page.</p>
          <div className="admin-featured-list">
            {adminData.projects.map((p) => (
              <label key={`feat-${p.id}`} className="check listed">
                <input
                  type="checkbox"
                  checked={featuredSet.has(p.id)}
                  onChange={(e) => {
                    setFeaturedSet((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(p.id);
                      else next.delete(p.id);
                      return next;
                    });
                  }}
                />
                <span>{p.title}</span>
                <small>{p.categoryId}</small>
              </label>
            ))}
          </div>
          <button className="btn-primary" disabled={saving || loadingAdmin} onClick={saveFeatured}>Save featured list</button>
        </section>
      </div>
    </main>
  );
}
