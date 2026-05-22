// Auth UI — handles login/register/guest screens
import { api, getLevelProgress, LEVEL_COLORS, LEVEL_NAMES } from './api.js';
import { COLORS, COLOR_NAMES } from './config.js';

export class AuthManager {
  constructor(onAuthenticated) {
    this.onAuthenticated = onAuthenticated;
    this.selectedColor = COLORS[0];

    this._buildUI();
    this._bindEvents();
  }

  _buildUI() {
    // Find or create auth screen container (injected into #app)
    this.container = document.getElementById('authScreen');
  }

  // Try auto-login from saved token
  async tryAutoLogin() {
    const token = api.getToken();
    const cachedUser = api.getUser();

    if (token && cachedUser) {
      try {
        const freshUser = await api.fetchMe();
        this.onAuthenticated(freshUser, false);
        return true;
      } catch {
        api.removeToken();
      }
    }
    return false;
  }

  show() {
    this.container.style.display = 'flex';
    this._renderColorPicker();
  }

  hide() {
    this.container.style.display = 'none';
  }

  _renderColorPicker() {
    const row = document.getElementById('authColorRow');
    if (!row) return;
    row.innerHTML = '';
    COLORS.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'color-btn' + (c === this.selectedColor ? ' selected' : '');
      btn.style.background = c;
      btn.title = COLOR_NAMES[i];
      btn.onclick = () => {
        this.selectedColor = c;
        row.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      };
      row.appendChild(btn);
    });
  }

  _bindEvents() {
    // Tab switching
    document.getElementById('authTabLogin')?.addEventListener('click', () => this._showTab('login'));
    document.getElementById('authTabRegister')?.addEventListener('click', () => this._showTab('register'));

    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this._handleLogin();
    });

    // Register form
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this._handleRegister();
    });

    // Guest button
    document.getElementById('guestPlayBtn')?.addEventListener('click', () => {
      this._handleGuest();
    });
  }

  _showTab(tab) {
    const loginPanel = document.getElementById('loginPanel');
    const registerPanel = document.getElementById('registerPanel');
    const tabLogin = document.getElementById('authTabLogin');
    const tabRegister = document.getElementById('authTabRegister');

    if (tab === 'login') {
      loginPanel.style.display = 'flex';
      registerPanel.style.display = 'none';
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
    } else {
      loginPanel.style.display = 'none';
      registerPanel.style.display = 'flex';
      tabLogin.classList.remove('active');
      tabRegister.classList.add('active');
    }
    this._clearErrors();
  }

  async _handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginSubmitBtn');

    if (!username || !password) {
      this._showError('loginError', 'Username va parolni kiriting');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Kirilmoqda...';

    try {
      const data = await api.login(username, password);
      this.onAuthenticated(data.user, false);
    } catch (err) {
      this._showError('loginError', err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Kirish';
    }
  }

  async _handleRegister() {
    const username = document.getElementById('regUsername').value.trim();
    const displayName = document.getElementById('regDisplayName').value.trim();
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;
    const btn = document.getElementById('registerSubmitBtn');

    if (!username || !password) {
      this._showError('registerError', 'Username va parolni kiriting');
      return;
    }

    if (password !== password2) {
      this._showError('registerError', 'Parollar mos kelmaydi');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Ro\'yxatdan o\'tilmoqda...';

    try {
      const data = await api.register(username, password, displayName || username, this.selectedColor);
      this.onAuthenticated(data.user, true);
    } catch (err) {
      this._showError('registerError', err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Ro\'yxatdan o\'tish';
    }
  }

  _handleGuest() {
    this.onAuthenticated(null, false); // null = guest
  }

  _showError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  _clearErrors() {
    ['loginError', 'registerError'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }
}

// ── Profile Panel Renderer ────────────────────────
export function renderProfilePanel(user) {
  const panel = document.getElementById('profilePanel');
  if (!panel || !user) return;

  const lvl = getLevelProgress(user.xp || 0);
  const winRate = user.games_played > 0 ? Math.round((user.wins / user.games_played) * 100) : 0;

  panel.innerHTML = `
    <div class="profile-avatar" style="background: ${user.color || '#4da6ff'}">
      ${(user.display_name || user.username || 'G')[0].toUpperCase()}
    </div>
    <div class="profile-info">
      <div class="profile-name">${user.display_name || user.username}</div>
      <div class="profile-username">@${user.username}</div>
      <div class="profile-level-badge" style="color: ${LEVEL_COLORS[lvl.level]}">
        ⭐ ${LEVEL_NAMES[lvl.level]}
      </div>
      <div class="xp-bar-wrap">
        <div class="xp-bar-fill" style="width: ${lvl.progress}%"></div>
        <span class="xp-label">${user.xp || 0} XP</span>
      </div>
    </div>
    <div class="profile-stats">
      <div class="stat-chip win">🏆 ${user.wins || 0}</div>
      <div class="stat-chip loss">💀 ${user.losses || 0}</div>
      <div class="stat-chip draw">🤝 ${user.draws || 0}</div>
      <div class="stat-chip rate">${winRate}%</div>
    </div>
  `;
}
