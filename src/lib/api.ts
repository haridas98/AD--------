const rawBase =
  (import.meta as any).env?.VITE_API_BASE_URL ??
  ((import.meta as any).env?.DEV ? 'http://localhost:8787' : '');
const API_BASE = String(rawBase || '').replace(/\/+$/, '');
const TOKEN_KEY = 'ad_admin_token';
function getToken(): string { return localStorage.getItem(TOKEN_KEY) || ''; }
function setToken(token: string) { if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); }

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed?.error || `Request failed: ${response.status}`);
    } catch {
      throw new Error(text || `Request failed: ${response.status}`);
    }
  }
  return response.json();
}

export const api = {
  getContent: () => request('/api/content'),
  getAdminContent: () => request('/api/admin/content'),
  updateThemeSettings: (payload: any) => request('/api/admin/theme-settings', { method: 'PUT', body: JSON.stringify(payload) }),
  getStats: () => request('/api/admin/stats'),
  createProject: (p: any) => request('/api/admin/projects', { method: 'POST', body: JSON.stringify(p) }),
  updateProject: (id: string, p: any) => request(`/api/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  deleteProject: (id: string) => request(`/api/admin/projects/${id}`, { method: 'DELETE' }),
  generateProjectPageDraft: (projectId: string, payload: any) => request(`/api/admin/projects/${projectId}/ai/generate-page`, { method: 'POST', body: JSON.stringify(payload) }),
  generateAiText: (payload: any) => request('/api/admin/ai/generate-text', { method: 'POST', body: JSON.stringify(payload) }),
  createBlog: (p: any) => request('/api/admin/blog', { method: 'POST', body: JSON.stringify(p) }),
  updateBlog: (id: string, p: any) => request(`/api/admin/blog/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  deleteBlog: (id: string) => request(`/api/admin/blog/${id}`, { method: 'DELETE' }),
  createCategory: (p: any) => request('/api/admin/categories', { method: 'POST', body: JSON.stringify(p) }),
  updateCategory: (id: string, p: any) => request(`/api/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  deleteCategory: (id: string) => request(`/api/admin/categories/${id}`, { method: 'DELETE' }),
  login: async (username: string, password: string) => { const r = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }); setToken(r.token); return r; },
  logout: async () => { try { await request('/api/auth/logout', { method: 'POST' }); } finally { setToken(''); } },
  me: () => request('/api/auth/me'),
  getProjectAssets: (projectId: string) => request(`/api/admin/projects/${projectId}/assets`),
  uploadProjectAsset: async (projectId: string, file: File) => {
    const fd = new FormData();
    fd.append('asset', file);
    return request(`/api/admin/projects/${projectId}/assets/upload`, { method: 'POST', body: fd });
  },
  importProjectAssetUrl: (projectId: string, url: string) => request(`/api/admin/projects/${projectId}/assets/import-url`, { method: 'POST', body: JSON.stringify({ url }) }),
  syncProjectAssets: (projectId: string) => request(`/api/admin/projects/${projectId}/assets/sync`, { method: 'POST', body: JSON.stringify({}) }),
  updateProjectAsset: (projectId: string, assetId: string, payload: any) => request(`/api/admin/projects/${projectId}/assets/${assetId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteProjectAsset: (projectId: string, assetId: string) => request(`/api/admin/projects/${projectId}/assets/${assetId}`, { method: 'DELETE' }),
  uploadImage: async (file: File, projectName?: string, imageIndex?: string) => { const fd = new FormData(); fd.append('image', file); if (projectName) fd.append('projectName', projectName); if (imageIndex) fd.append('imageIndex', imageIndex); return request('/api/admin/upload-image', { method: 'POST', body: fd }); },
  getStoredToken: () => getToken(),
  clearToken: () => setToken(''),
};
