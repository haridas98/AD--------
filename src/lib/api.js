const API_BASE = 'http://localhost:8787';
const TOKEN_KEY = 'ad_admin_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

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
  getContent: () => request('/api/content'),
  getAdminContent: () => request('/api/admin/content'),
  createProject: (payload) => request('/api/admin/projects', { method: 'POST', body: JSON.stringify(payload) }),
  updateProject: (id, payload) => request(`/api/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProject: (id) => request(`/api/admin/projects/${id}`, { method: 'DELETE' }),
  saveHomeFeatured: (projectIds) => request('/api/admin/home-featured', { method: 'PUT', body: JSON.stringify({ projectIds }) }),

  login: async (username, password) => {
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

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return request('/api/admin/upload-image', { method: 'POST', body: formData });
  },

  getStoredToken: () => getToken(),
  clearToken: () => setToken('')
};
