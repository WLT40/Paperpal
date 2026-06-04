const API_BASE = '/api';

function getToken() { return localStorage.getItem('paperpal_token'); }
function setToken(t) { localStorage.setItem('paperpal_token', t); }
function clearToken() { localStorage.removeItem('paperpal_token'); }

async function request(url, options = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { headers, ...options };

  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (options.body) {
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    if (config.headers['Content-Type'] === 'application/json' && typeof options.body !== 'string') {
      config.body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(`${API_BASE}${url}`, config);
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/pdf')) return response.blob();

  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) { clearToken(); window.dispatchEvent(new CustomEvent('paperpal-auth-error')); }
    throw new Error(data.detail || `HTTP ${response.status}`);
  }
  return data;
}

export const api = {
  get: (url) => request(url),
  post: (url, data) => request(url, { method: 'POST', body: data }),
  put: (url, data) => request(url, { method: 'PUT', body: data }),
  patch: (url, data) => request(url, { method: 'PATCH', body: data }),
  delete: (url) => request(url, { method: 'DELETE' }),
  upload: (url, formData) => request(url, { method: 'POST', body: formData }),
  getToken, setToken, clearToken,
};
