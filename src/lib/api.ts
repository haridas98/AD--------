import type { ContentData, Project } from '../types';

const API_BASE = 'http://localhost:8787';
const TOKEN_KEY = 'ad_admin_token';

function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function setToken(token: string) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getContent: (): Promise<ContentData> => request('/api/content'),
  getAdminContent: (): Promise<ContentData> => request('/api/admin/content'),
  createProject: (payload: Partial<Project>): Promise<Project> => request('/api/admin/projects', { method: 'POST', body: JSON.stringify(payload) }),
  updateProject: (id: string, payload: Partial<Project>): Promise<Project> => request(`/api/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProject: (id: string): Promise<{ ok: boolean }> => request(`/api/admin/projects/${id}`, { method: 'DELETE' }),
  saveHomeFeatured: (projectIds: string[]): Promise<{ ok: boolean }> => request('/api/admin/home-featured', { method: 'PUT', body: JSON.stringify({ projectIds }) }),

  login: async (username: string, password: string): Promise<{ token: string }> => {
    const result = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    setToken(result.token);
    return result;
  },
  logout: async (): Promise<void> => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setToken('');
    }
  },
  me: (): Promise<{ ok: boolean; user: string }> => request('/api/auth/me'),

  uploadImage: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    return request('/api/admin/upload-image', { method: 'POST', body: formData });
  },

  getStoredToken: (): string => getToken(),
  clearToken: () => setToken('')
};
