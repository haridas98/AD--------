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

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getContent: () => request('/api/content'),
  getAdminContent: () => request('/api/admin/content'),

  // Categories
  createCategory: (payload: any) => request('/api/admin/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id: string, payload: any) => request(`/api/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id: string) => request(`/api/admin/categories/${id}`, { method: 'DELETE' }),

  // Projects
  createProject: (payload: any) => request('/api/admin/projects', { method: 'POST', body: JSON.stringify(payload) }),
  updateProject: (id: string, payload: any) => request(`/api/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProject: (id: string) => request(`/api/admin/projects/${id}`, { method: 'DELETE' }),

  // Auth
  login: async (username: string, password: string) => {
    const result = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    setToken(result.token);
    return result;
  },
  logout: async () => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setToken('');
    }
  },
  me: () => request('/api/auth/me'),

  // Images
  uploadImage: async (file: File, projectName?: string, imageIndex?: number) => {
    const formData = new FormData();
    formData.append('image', file);
    if (projectName) formData.append('projectName', projectName);
    if (imageIndex !== undefined) formData.append('imageIndex', String(imageIndex));
    return request('/api/admin/upload-image', { method: 'POST', body: formData });
  },

  getStoredToken: () => getToken(),
  clearToken: () => setToken(''),
};
