import { authManager } from '../auth/AuthManager.js';

export class CoverController {
  constructor({ onEnterLobby, onLogout }) {
    this.onEnterLobby = onEnterLobby;
    this.onLogout = onLogout;
    this.cover = document.getElementById('coverScreen');
    this._bindTabs();
    this._bindForms();
    this._autoLogin();
  }

  _bindTabs() {
    const tabs = this.cover.querySelectorAll('.cover-tab');
    const forms = this.cover.querySelectorAll('.cover-form');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        forms.forEach(f => f.classList.toggle('active', f.id === `cover${target.charAt(0).toUpperCase() + target.slice(1)}Form`));
      });
    });
  }

  _bindForms() {
    const loginForm = document.getElementById('coverLoginForm');
    const registerForm = document.getElementById('coverRegisterForm');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      this._clearErrors();
      const username = document.getElementById('coverLoginUsername').value.trim();
      const password = document.getElementById('coverLoginPassword').value;
      if (!this._validateUsername(username)) return;
      if (!this._validatePassword(password)) return;
      const btn = loginForm.querySelector('.cover-submit');
      const originalText = btn.textContent;
      btn.textContent = '登录中…';
      btn.disabled = true;
      try {
        const res = await authManager.login(username, password);
        if (res.success) {
          this._enterLobby();
        } else {
          this._showError('coverLoginError', res.message || '登录失败');
        }
      } catch (err) {
        this._showError('coverLoginError', '网络错误，请检查服务端');
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      this._clearErrors();
      const username = document.getElementById('coverRegisterUsername').value.trim();
      const password = document.getElementById('coverRegisterPassword').value;
      const password2 = document.getElementById('coverRegisterPassword2').value;
      if (!this._validateUsername(username, 'coverRegisterError')) return;
      if (!this._validatePassword(password, 'coverRegisterError')) return;
      if (password !== password2) {
        return this._showError('coverRegisterError', '两次输入的密码不一致');
      }
      const btn = registerForm.querySelector('.cover-submit');
      const originalText = btn.textContent;
      btn.textContent = '注册中…';
      btn.disabled = true;
      try {
        const res = await authManager.register(username, password);
        if (res.success) {
          this._enterLobby();
        } else {
          this._showError('coverRegisterError', res.message || '注册失败');
        }
      } catch (err) {
        this._showError('coverRegisterError', '网络错误，请检查服务端');
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });

    this._bindInputClear(loginForm);
    this._bindInputClear(registerForm);
  }

  async _autoLogin() {
    if (!authManager.isLoggedIn()) return;
    const res = await authManager.validate();
    if (res.success) {
      this._enterLobby();
    }
  }

  _enterLobby(userInfo) {
    this.cover.classList.remove('active');
    if (typeof this.onEnterLobby === 'function') {
      this.onEnterLobby(userInfo || authManager.getUserInfo());
    }
  }

  show() {
    this.cover.classList.add('active');
    document.getElementById('coverLoginUsername').focus();
  }

  logout() {
    authManager.logout();
    const lobby = document.getElementById('lobbyScreen');
    if (lobby) lobby.classList.remove('active');
    this.show();
    if (typeof this.onLogout === 'function') {
      this.onLogout();
    }
  }

  _bindInputClear(form) {
    form.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => this._clearErrors());
    });
  }

  _validateUsername(username, errorId = 'coverLoginError') {
    if (!username) {
      this._showError(errorId, '请输入用户名');
      return false;
    }
    if (username.length < 3 || username.length > 20) {
      this._showError(errorId, '用户名长度应为 3-20 位');
      return false;
    }
    return true;
  }

  _validatePassword(password, errorId = 'coverLoginError') {
    if (!password) {
      this._showError(errorId, '请输入密码');
      return false;
    }
    if (password.length < 6 || password.length > 32) {
      this._showError(errorId, '密码长度应为 6-32 位');
      return false;
    }
    return true;
  }

  _showError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
  }

  _clearErrors() {
    ['coverLoginError', 'coverRegisterError'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
  }
}
