const API_BASE = process.env.REACT_APP_API_URL || '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('skyportal_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('skyportal_token', token);
    } else {
      localStorage.removeItem('skyportal_token');
    }
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  async request(method, path, body = null) {
    const options = {
      method,
      headers: this.getHeaders(),
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.error || `Request failed: ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  get(path) { return this.request('GET', path); }
  post(path, body) { return this.request('POST', path, body); }
  put(path, body) { return this.request('PUT', path, body); }
  patch(path, body) { return this.request('PATCH', path, body); }
  delete(path) { return this.request('DELETE', path); }
}

export const api = new ApiClient();
export default api;
