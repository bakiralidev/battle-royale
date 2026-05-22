// Central API Client — All REST calls go through here
const BASE_URL = '';

export const api = {
  // ── Auth Helpers ──────────────────────────────────
  getToken() {
    return localStorage.getItem('br_token');
  },

  setToken(token) {
    localStorage.setItem('br_token', token);
  },

  removeToken() {
    localStorage.removeItem('br_token');
    localStorage.removeItem('br_user');
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('br_user'));
    } catch { return null; }
  },

  setUser(user) {
    localStorage.setItem('br_user', JSON.stringify(user));
  },

  isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  },

  // ── Core Fetch ────────────────────────────────────
  async request(method, endpoint, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(BASE_URL + endpoint, opts);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'So\'rov xatosi');
    return data;
  },

  get(endpoint) { return this.request('GET', endpoint); },
  post(endpoint, body) { return this.request('POST', endpoint, body); },
  put(endpoint, body) { return this.request('PUT', endpoint, body); },
  del(endpoint) { return this.request('DELETE', endpoint); },

  // ── Auth API ──────────────────────────────────────
  async register(username, password, displayName, color) {
    const data = await this.post('/api/auth/register', { username, password, displayName, color });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  async login(username, password) {
    const data = await this.post('/api/auth/login', { username, password });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  async fetchMe() {
    const data = await this.get('/api/auth/me');
    this.setUser(data.user);
    return data.user;
  },

  logout() {
    this.removeToken();
  },

  async updateProfile(displayName, color, avatar, customEmojis, customSmiley, savedSmileys) {
    const data = await this.put('/api/auth/profile', { displayName, color, avatar, customEmojis, customSmiley, savedSmileys });
    this.setUser(data.user);
    return data.user;
  },

  // ── Friends API ───────────────────────────────────
  async getFriends() {
    const data = await this.get('/api/friends');
    return data.friends;
  },

  async getFriendRequests() {
    const data = await this.get('/api/friends/requests');
    return data;
  },

  async sendFriendRequest(targetUsername) {
    return this.post('/api/friends/request', { targetUsername });
  },

  async acceptFriend(senderId) {
    return this.post('/api/friends/accept', { senderId });
  },

  async rejectFriend(senderId) {
    return this.post('/api/friends/reject', { senderId });
  },

  async removeFriend(friendId) {
    return this.del(`/api/friends/${friendId}`);
  },

  async searchUsers(query) {
    const data = await this.get(`/api/friends/search?q=${encodeURIComponent(query)}`);
    return data.users;
  },

  // ── Stats API ─────────────────────────────────────
  async getLeaderboard() {
    const data = await this.get('/api/stats/leaderboard');
    return data.leaders;
  },

  async getGameHistory() {
    const data = await this.get('/api/stats/history');
    return data.games;
  },

  async getLoginSessions() {
    const data = await this.get('/api/stats/sessions');
    return data.sessions;
  }
};

// ── Level Utils (shared with frontend) ──────────────
export const LEVEL_NAMES = ['', 'Yangi Boshlovchi', 'Qo\'riqchi', 'Jangchi', 'Veteran', 'Ustoz', 'Afsonaviy'];
export const LEVEL_XP = [0, 0, 100, 300, 600, 1000, 2000];
export const LEVEL_COLORS = ['', '#aaa', '#4da6ff', '#2ecc71', '#f39c12', '#9b59b6', '#e94560'];

export function getLevel(xp) {
  if (xp >= 2000) return 6;
  if (xp >= 1000) return 5;
  if (xp >= 600) return 4;
  if (xp >= 300) return 3;
  if (xp >= 100) return 2;
  return 1;
}

export function getLevelProgress(xp) {
  const lvl = getLevel(xp);
  if (lvl >= 6) return { level: 6, name: LEVEL_NAMES[6], progress: 100, current: xp, next: xp };
  const start = LEVEL_XP[lvl];
  const end = LEVEL_XP[lvl + 1];
  const pct = Math.round(((xp - start) / (end - start)) * 100);
  return { level: lvl, name: LEVEL_NAMES[lvl], color: LEVEL_COLORS[lvl], progress: pct, current: xp, next: end, xpToNext: end - xp };
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
