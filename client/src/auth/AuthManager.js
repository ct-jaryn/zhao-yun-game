const TOKEN_KEY = 'zy_auth_token';

function _decodePayload(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
}

export class AuthManager {
  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY) || '';
    this.user = this.token ? _decodePayload(this.token) : null;
  }

  isLoggedIn() {
    return !!this.token && !!this.user && this.user.exp * 1000 > Date.now();
  }

  getToken() {
    return this.token;
  }

  getUserInfo() {
    return this.user ? { userId: this.user.userId, username: this.user.username } : null;
  }

  async register(username, password) {
    return this._authRequest('/api/auth/register', { username, password });
  }

  async login(username, password) {
    return this._authRequest('/api/auth/login', { username, password });
  }

  async _authRequest(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({ success: false, message: '网络错误' }));
    if (data.success && data.token) {
      this._setToken(data.token);
    }
    return data;
  }

  async validate() {
    if (!this.token) return { success: false };
    const res = await this.fetchWithAuth('/api/auth/me');
    if (!res.success) {
      this.logout();
    }
    return res;
  }

  fetchWithAuth(url, options = {}) {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${this.token}`
    };
    return fetch(url, { ...options, headers });
  }

  logout() {
    this.token = '';
    this.user = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  _setToken(token) {
    this.token = token;
    this.user = _decodePayload(token);
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export const authManager = new AuthManager();
