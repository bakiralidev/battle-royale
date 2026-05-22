// Friends Panel — Friend list, requests, search
import { api, formatDate, LEVEL_NAMES, LEVEL_COLORS } from './api.js';

export class FriendsPanel {
  constructor() {
    this.panel = document.getElementById('friendsPanel');
    this.isOpen = false;
    this._bindEvents();
  }

  async open() {
    if (!api.isAuthenticated()) return;
    this.isOpen = true;
    this.panel.classList.add('open');
    await this._refresh();
  }

  close() {
    this.isOpen = false;
    this.panel.classList.remove('open');
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  async _refresh() {
    await Promise.all([
      this._loadFriends(),
      this._loadRequests()
    ]);
  }

  async _loadFriends() {
    const list = document.getElementById('friendsList');
    if (!list) return;
    list.innerHTML = '<div class="loading-spinner">Yuklanmoqda...</div>';
 
    try {
      const friends = await api.getFriends();
      if (!friends.length) {
        list.innerHTML = '<div class="empty-state">Do\'stlar yo\'q. Qidiruvdan qo\'shing!</div>';
        return;
      }
 
      list.innerHTML = friends.map(f => {
        const avatarHTML = f.avatar 
          ? `<div class="friend-avatar" style="background:${f.color}"><img src="${f.avatar}" alt="${f.display_name || f.username}"></div>`
          : `<div class="friend-avatar" style="background:${f.color}">${(f.display_name || f.username)[0].toUpperCase()}</div>`;
        
        const statusDotHTML = `<span class="status-dot ${f.isOnline ? 'online' : 'offline'}" title="${f.isOnline ? 'Online' : 'Offline'}"></span>`;

        return `
          <div class="friend-row" data-id="${f.id}">
            ${avatarHTML}
            <div class="friend-info">
              <span class="friend-name">${f.display_name || f.username}${statusDotHTML}</span>
              <span class="friend-level" style="color:${LEVEL_COLORS[f.level || 1]}">Lv.${f.level || 1} ${LEVEL_NAMES[f.level || 1]}</span>
            </div>
            <div class="friend-stats">🏆 ${f.wins || 0}</div>
            <button class="friend-remove-btn" data-id="${f.id}" title="Do'stlikdan chiqarish">✕</button>
          </div>
        `;
      }).join('');
 
      list.querySelectorAll('.friend-remove-btn').forEach(btn => {
        btn.onclick = async () => {
          if (!confirm('Do\'stlikdan chiqarilsinmi?')) return;
          try {
            await api.removeFriend(btn.dataset.id);
            await this._loadFriends();
          } catch (err) {
            alert(err.message);
          }
        };
      });
    } catch (err) {
      list.innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  }

  async _loadRequests() {
    const requestsDiv = document.getElementById('friendRequestsList');
    const badge = document.getElementById('friendRequestsBadge');
    if (!requestsDiv) return;

    try {
      const { received } = await api.getFriendRequests();

      // Update notification badge
      if (badge) {
        badge.textContent = received.length || '';
        badge.style.display = received.length ? 'flex' : 'none';
      }

      if (!received.length) {
        requestsDiv.innerHTML = '<div class="empty-state">Yangi so\'rovlar yo\'q</div>';
        return;
      }

      requestsDiv.innerHTML = received.map(r => {
        const avatarHTML = r.avatar 
          ? `<div class="friend-avatar" style="background:${r.color}"><img src="${r.avatar}" alt="${r.display_name || r.username}"></div>`
          : `<div class="friend-avatar" style="background:${r.color}">${(r.display_name || r.username)[0].toUpperCase()}</div>`;

        return `
          <div class="request-row" data-sender="${r.sender_id}">
            ${avatarHTML}
            <div class="friend-info">
              <span class="friend-name">${r.display_name || r.username}</span>
              <span class="friend-level" style="color:${LEVEL_COLORS[r.level || 1]}">Lv.${r.level || 1}</span>
            </div>
            <button class="accept-btn" data-id="${r.sender_id}">✓ Qabul</button>
            <button class="reject-btn" data-id="${r.sender_id}">✕</button>
          </div>
        `;
      }).join('');

      requestsDiv.querySelectorAll('.accept-btn').forEach(btn => {
        btn.onclick = async () => {
          try {
            await api.acceptFriend(btn.dataset.id);
            await this._refresh();
            this._showToast('Do\'stlik qabul qilindi! 🎉');
          } catch (err) { alert(err.message); }
        };
      });

      requestsDiv.querySelectorAll('.reject-btn').forEach(btn => {
        btn.onclick = async () => {
          try {
            await api.rejectFriend(btn.dataset.id);
            await this._loadRequests();
          } catch (err) { alert(err.message); }
        };
      });
    } catch (err) {
      requestsDiv.innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  }

  _bindEvents() {
    // Close button
    document.getElementById('closeFriendsBtn')?.addEventListener('click', () => this.close());

    // Tab switching
    document.getElementById('friendTabList')?.addEventListener('click', () => this._showFriendTab('list'));
    document.getElementById('friendTabRequests')?.addEventListener('click', () => this._showFriendTab('requests'));
    document.getElementById('friendTabSearch')?.addEventListener('click', () => this._showFriendTab('search'));

    // Search
    let searchTimeout;
    document.getElementById('friendSearchInput')?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => this._doSearch(e.target.value), 400);
    });

    document.getElementById('friendSearchBtn')?.addEventListener('click', () => {
      const q = document.getElementById('friendSearchInput')?.value;
      if (q) this._doSearch(q);
    });
  }

  _showFriendTab(tab) {
    const tabs = { list: 'friendsListPanel', requests: 'friendRequestsPanel', search: 'friendSearchPanel' };
    Object.entries(tabs).forEach(([key, panelId]) => {
      const panel = document.getElementById(panelId);
      const tabBtn = document.getElementById(key === 'list' ? 'friendTabList' : key === 'requests' ? 'friendTabRequests' : 'friendTabSearch');
      if (panel) panel.style.display = key === tab ? 'block' : 'none';
      if (tabBtn) tabBtn.classList.toggle('active', key === tab);
    });
  }

  async _doSearch(query) {
    const results = document.getElementById('friendSearchResults');
    if (!results) return;
    if (query.length < 2) {
      results.innerHTML = '<div class="empty-state">Kamida 2 ta harf kiriting</div>';
      return;
    }

    results.innerHTML = '<div class="loading-spinner">Qidirilmoqda...</div>';

    try {
      const users = await api.searchUsers(query);

      if (!users.length) {
        results.innerHTML = '<div class="empty-state">Foydalanuvchi topilmadi</div>';
        return;
      }

      results.innerHTML = users.map(u => {
        let actionBtn = '';
        if (u.relation === 'accepted') {
          actionBtn = `<span class="relation-badge friend">Do'st ✓</span>`;
        } else if (u.relation === 'pending') {
          actionBtn = `<span class="relation-badge pending">So'rov yuborilgan</span>`;
        } else {
          actionBtn = `<button class="add-friend-btn" data-username="${u.username}">+ Do'st qo'sh</button>`;
        }

        const avatarHTML = u.avatar 
          ? `<div class="friend-avatar" style="background:${u.color}"><img src="${u.avatar}" alt="${u.display_name || u.username}"></div>`
          : `<div class="friend-avatar" style="background:${u.color}">${(u.display_name || u.username)[0].toUpperCase()}</div>`;

        return `
          <div class="search-result-row">
            ${avatarHTML}
            <div class="friend-info">
              <span class="friend-name">${u.display_name || u.username}</span>
              <span class="friend-username">@${u.username}</span>
            </div>
            <div class="friend-stats">🏆 ${u.wins || 0}</div>
            ${actionBtn}
          </div>
        `;
      }).join('');

      results.querySelectorAll('.add-friend-btn').forEach(btn => {
        btn.onclick = async () => {
          btn.disabled = true;
          btn.textContent = 'Yuborilmoqda...';
          try {
            await api.sendFriendRequest(btn.dataset.username);
            btn.textContent = 'So\'rov yuborildi ✓';
            btn.classList.add('sent');
            this._showToast(`${btn.dataset.username} ga so'rov yuborildi!`);
          } catch (err) {
            btn.disabled = false;
            btn.textContent = '+ Do\'st qo\'sh';
            alert(err.message);
          }
        };
      });
    } catch (err) {
      results.innerHTML = `<div class="error-state">${err.message}</div>`;
    }
  }

  _showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast-notif';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
  }
}
