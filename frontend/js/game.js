// Battle Royale — Main Game Module (Home Page Flow)
import { COLORS, COLOR_NAMES, GAME_CONFIG } from './config.js';
import { UIManager } from './ui.js';
import { Player } from './player.js';
import { Item } from './item.js';
import { api, getLevelProgress, LEVEL_NAMES, LEVEL_COLORS, formatDate } from './api.js';
import { FriendsPanel } from './friends.js';
import { sounds } from './sound.js';
import { SmileyEditor } from './smiley-editor.js';
import { initBouncingWidgets } from './bouncing.js';

// Particle class for juice effects
class GameParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 120;
    this.vy = (Math.random() - 0.5) * 120 - 40; // upward bias
    this.color = color;
    this.radius = 2 + Math.random() * 3;
    this.life = 0.4 + Math.random() * 0.3; // duration in seconds
    this.maxLife = this.life;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 120 * dt; // gravity
    this.life -= dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Floating Text class for damage feedback
class FloatingText {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.vy = -45; // move upwards
    this.text = text;
    this.color = color;
    this.life = 0.8; // duration in seconds
    this.maxLife = this.life;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.life -= dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.font = 'bold 13px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// ── Globals ────────────────────────────────────────────────
const ui = new UIManager();
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let lastMousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  lastMousePos.x = e.clientX - rect.left;
  lastMousePos.y = e.clientY - rect.top;
});

const state = {
  running: false,
  status: 'lobby',
  player: null,
  players: [],
  items: [],
  bullets: [],
  bombs: [],
  zoneR: 0,
  zoneCx: GAME_CONFIG.WIDTH / 2,
  zoneCy: GAME_CONFIG.HEIGHT / 2,
  zoneTimer: GAME_CONFIG.ZONE_DURATION,
  animId: null,
  roomCode: null,
  isHost: false,
  hostId: null,
  currentUser: null,
  isGuest: true,
  particles: [],
  floatingTexts: [],
  screenShake: 0
};

// ── Screen references ──────────────────────────────────────
const homePage    = document.getElementById('homePage');
const lobbySection = document.getElementById('lobby');
const gameWrapper  = document.getElementById('gameWrapper');

// ── Solo Bot Controls DOM refs ─────────────────────────────
const soloControls   = document.getElementById('soloControls');
const soloExitBtn    = document.getElementById('soloExitBtn');
const soloRestartBtn = document.getElementById('soloRestartBtn');

// ── Lobby DOM refs ─────────────────────────────────────────
const lobbySetup      = document.getElementById('lobbySetup');
const lobbyWaiting    = document.getElementById('lobbyWaiting');
const createRoomBtn   = document.getElementById('createRoomBtn');
const joinRoomBtn     = document.getElementById('joinRoomBtn');
const leaveRoomBtn    = document.getElementById('leaveRoomBtn');
const useBotsCheckbox = document.getElementById('useBotsCheckbox');
const botCountInput   = document.getElementById('botCountInput');
const botCountContainer = document.getElementById('botCountContainer');
const roomCodeInput   = document.getElementById('roomCodeInput');
const displayRoomCode = document.getElementById('displayRoomCode');
const lobbyPlayersList = document.getElementById('lobbyPlayersList');
const roomSettingsInfo = document.getElementById('roomSettingsInfo');
const waitingStatusMsg = document.getElementById('waitingStatusMsg');

// ── Socket ─────────────────────────────────────────────────
let socket = null;

function initSocket(token) {
  if (socket) socket.disconnect();
  socket = io({ auth: { token: token || null } });
  bindSocketEvents();
}

function bindSocketEvents() {
  socket.on('init_config', () => {});

  socket.on('shoot_sound_event', ({ playerId, weaponType }) => {
    let soundType = 'shoot';
    if (weaponType === 'Pistolet') soundType = 'shoot_pistol';
    else if (weaponType === 'Miltiq') soundType = 'shoot_rifle';
    else if (weaponType === 'Sniper') soundType = 'shoot_sniper';

    let volume = 1.0;
    if (state.player && playerId !== socket.id) {
      const other = state.players.find(p => p.id === playerId);
      if (other) {
        const d = Math.hypot(other.x - state.player.x, other.y - state.player.y);
        volume = Math.max(0, 1 - d / 1200);
      }
    }
    if (volume > 0.05) {
      sounds.play(soundType, volume);
    }
  });

  socket.on('room_joined', ({ roomCode, isHost, hostId }) => {
    state.roomCode = roomCode;
    state.isHost   = isHost;
    state.hostId   = hostId;
    lobbySetup.style.display  = 'none';
    lobbyWaiting.style.display = 'flex';
    displayRoomCode.textContent = roomCode;
    resetRoomBtns();
  });

  socket.on('room_error', (msg) => {
    showToast(msg, 'error');
    resetRoomBtns();
  });

  socket.on('countdown_tick', ({ seconds }) => {
    if (state.isHost) {
      ui.startBtn.disabled = true;
      ui.startBtn.textContent = `Boshlanmoqda: ${seconds}s`;
    } else {
      waitingStatusMsg.textContent = `O'yin boshlanmoqda: ${seconds}s`;
      waitingStatusMsg.style.color = '#ff2a5f';
    }
    if (seconds > 0) {
      sounds.play('countdown');
    }
  });

  socket.on('game_started', () => {
    ui.showGame();
    ui.overlay.style.display = 'none';
    canvas.focus();
    state.running = true;
    lastDx = 0; lastDy = 0;
    if (state.animId) cancelAnimationFrame(state.animId);
    sounds.play('countdown_start');
    lastFrameTime = performance.now();
    loop();
  });

  socket.on('state_update', (serverState) => {
    const prevPlayer = state.player;
    state.status  = serverState.status;
    state.players = serverState.players.map(p => new Player(p));
    state.items   = serverState.items.map(it => new Item(it));
    state.bullets = serverState.bullets || [];
    state.bombs   = serverState.bombs || [];
    state.zoneR   = serverState.zone.r;
    state.zoneCx  = serverState.zone.cx;
    state.zoneCy  = serverState.zone.cy;
    state.zoneTimer = serverState.zone.timer;
    state.player  = state.players.find(p => p.id === socket.id);
    state.isHost  = (socket.id === serverState.hostId);

    // Dynamic Sound Checks
    if (state.player && prevPlayer) {
      // 1. Weapon pickup
      if (!prevPlayer.weapon && state.player.weapon) {
        sounds.play('pickup_weapon');
      }
      // 2. Medkit/Shield pickup
      if (state.player.hp > prevPlayer.hp) {
        sounds.play('pickup_medkit');
      }
      if (state.player.shieldTimer > 0 && (!prevPlayer.shieldTimer || prevPlayer.shieldTimer === 0)) {
        sounds.play('pickup_medkit');
      }
    }

    if (state.status === 'lobby' || state.status === 'countdown') {
      renderLobbyPlayers(serverState);
    }

    if (state.status === 'ended' && ui.restartBtn.style.display !== 'none') {
      ui.restartBtn.textContent = `Lobbyga qaytish: ${serverState.lobbyResetSeconds}s`;
    }

    if (soloControls) {
      const isSoloVsBots = state.status === 'playing' &&
                           state.players.filter(p => !p.isBot).length === 1 &&
                           state.players.filter(p => p.isBot).length > 0;
      soloControls.style.display = isSoloVsBots ? 'flex' : 'none';
    }
  });

  socket.on('game_ended', (data) => {
    const win = !!(state.player && data.winner && state.player.name === data.winner.name);
    ui.showEndGame(win, data.msg);
    if (win) {
      sounds.play('win');
    } else {
      sounds.play('lose');
    }
  });

  socket.on('combat_event', (evt) => {
    if (evt.type === 'hit') {
      const { a, b } = evt.detail; // a: attacker, b: victim
      const victim = state.players.find(p => p.id === b.id || p.name === b.name);
      const attacker = state.players.find(p => p.id === a.id || p.name === a.name);

      if (victim && victim.alive) {
        // Create hit particles
        createHitParticles(victim.x, victim.y, victim.color);

        // Determine if main player is involved
        const isMainVictim = state.player && (state.player.id === victim.id || state.player.name === victim.name);
        const isMainAttacker = state.player && (state.player.id === attacker?.id || state.player.name === attacker?.name);

        if (isMainVictim) {
          state.screenShake = 10;
          sounds.play('hit_take');
        } else if (isMainAttacker) {
          sounds.play('hit_give');
        } else {
          sounds.play('hit_give', 0.25);
        }

        // Add damage floating text
        let dmgText = '';
        if (attacker && attacker.weapon) {
          dmgText = `-${attacker.weapon.dmg}`;
        } else {
          dmgText = '-10';
        }
        createFloatingText(victim.x, victim.y - 15, dmgText, isMainVictim ? '#e94560' : '#ff9f43');
      }
    }
  });

  socket.on('stats_updated', ({ user, result }) => {
    state.currentUser = user;
    api.setUser(user);
    renderNavUser(user);

    const statsDiv = document.getElementById('overlayStatsUpdate');
    if (statsDiv) {
      const xpGain = result === 'win' ? 55 : result === 'draw' ? 25 : 15;
      const lvl = getLevelProgress(user.xp || 0);
      statsDiv.style.display = 'block';
      statsDiv.innerHTML = `
        <div class="stats-update-card">
          <div class="su-row"><span>Natija:</span><span class="su-result ${result}">${result === 'win' ? '🏆 G\'olib' : result === 'draw' ? '🤝 Durrang' : '💀 Mag\'lub'}</span></div>
          <div class="su-row"><span>XP qo'shildi:</span><span class="su-xp">+${xpGain} XP</span></div>
          <div class="su-row"><span>Daraja:</span><span style="color:${lvl.color}">Lv.${lvl.level} ${lvl.name}</span></div>
          <div class="su-row"><span>Jami g'alaba:</span><span>🏆 ${user.wins}</span></div>
        </div>`;
    }
  });

  socket.on('lobby_reset', () => {
    state.running = false;
    if (state.animId) cancelAnimationFrame(state.animId);
    ui.overlay.style.display   = 'none';
    gameWrapper.style.display  = 'none';
    lobbySection.style.display = 'flex';
    lobbySetup.style.display   = 'none';
    lobbyWaiting.style.display = 'flex';
    ui.startBtn.disabled    = false;
    ui.startBtn.textContent = "O'yinni boshlash";
    waitingStatusMsg.textContent = "Xona egasi o'yinni boshlashini kuting...";
    const sd = document.getElementById('overlayStatsUpdate');
    if (sd) sd.style.display = 'none';
  });

  socket.on('friend_update', (data) => {
    if (api.isAuthenticated()) {
      loadFriendBadge();
      if (friendsPanel.isOpen) {
        friendsPanel._refresh();
      }
    }
  });
}

// ── Auth Modal Helpers ─────────────────────────────────────
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// Close on backdrop click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.style.display = 'none';
  });
});

// Close buttons
document.querySelectorAll('.modal-close-btn').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.modal));
});

// Switch between modals
document.getElementById('switchToRegister')?.addEventListener('click', () => {
  closeModal('loginModal');
  openModal('registerModal');
});
document.getElementById('switchToLogin')?.addEventListener('click', () => {
  closeModal('registerModal');
  openModal('loginModal');
});

// ── Nav Buttons ────────────────────────────────────────────
document.getElementById('navLoginBtn')?.addEventListener('click', () => {
  clearAuthErrors();
  openModal('loginModal');
});

document.getElementById('navRegisterBtn')?.addEventListener('click', () => {
  clearAuthErrors();
  openModal('registerModal');
  renderAuthColorPicker();
});

// ── Login Form ─────────────────────────────────────────────
let selectedAuthColor = COLORS[0];

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginSubmitBtn');

  if (!username || !password) {
    return showAuthError('loginError', 'Username va parolni kiriting');
  }

  btn.disabled = true;
  btn.textContent = 'Kirilmoqda...';

  try {
    const data = await api.login(username, password);
    closeModal('loginModal');
    onUserAuthenticated(data.user, false);
    showToast(`Salom, ${data.user.display_name || data.user.username}! 👋`);
  } catch (err) {
    showAuthError('loginError', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Kirish';
  }
});

// ── Register Form ──────────────────────────────────────────
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username    = document.getElementById('regUsername').value.trim();
  const displayName = document.getElementById('regDisplayName').value.trim();
  const password    = document.getElementById('regPassword').value;
  const password2   = document.getElementById('regPassword2').value;
  const btn = document.getElementById('registerSubmitBtn');

  if (!username || !password) return showAuthError('registerError', 'Username va parolni kiriting');
  if (password !== password2) return showAuthError('registerError', 'Parollar mos kelmaydi');

  btn.disabled = true;
  btn.textContent = "Ro'yxatdan o'tilmoqda...";

  try {
    const data = await api.register(username, password, displayName || username, selectedAuthColor);
    closeModal('registerModal');
    onUserAuthenticated(data.user, true);
    showToast(`Xush kelibsiz, ${data.user.display_name || data.user.username}! 🎉`);
  } catch (err) {
    showAuthError('registerError', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Ro'yxatdan o'tish";
  }
});

function showAuthError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function clearAuthErrors() {
  ['loginError', 'registerError'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  });
}

function renderAuthColorPicker() {
  const row = document.getElementById('authColorRow');
  if (!row || row.children.length) return; // already rendered
  COLORS.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'color-btn' + (i === 0 ? ' selected' : '');
    btn.style.background = c;
    btn.title = COLOR_NAMES[i];
    btn.onclick = () => {
      selectedAuthColor = c;
      row.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    };
    row.appendChild(btn);
  });
}

// ── Hero CTA Buttons ───────────────────────────────────────
document.getElementById('heroPlayBtn')?.addEventListener('click', () => {
  clearAuthErrors();
  openModal('registerModal');
  renderAuthColorPicker();
});

document.getElementById('heroGuestBtn')?.addEventListener('click', () => {
  onUserAuthenticated(null, false); // guest
});

document.getElementById('heroEnterLobbyBtn')?.addEventListener('click', () => {
  goToLobby();
});

document.getElementById('heroLeaderboardBtn')?.addEventListener('click', async () => {
  await openLeaderboard();
});

// ── On Authenticated ───────────────────────────────────────
function onUserAuthenticated(user, isNew) {
  state.currentUser = user;
  state.isGuest = !user;

  if (user) {
    // Show user-specific nav elements
    document.getElementById('guestNavBtns').style.display  = 'none';
    document.getElementById('userNavBtns').style.display   = 'flex';
    document.getElementById('heroGuestBtns').style.display = 'none';
    document.getElementById('heroUserBtns').style.display  = 'flex';
    renderNavUserHome(user);
    loadFriendBadge();
  } else {
    // Guest — go straight to lobby
    showToast('Guest sifatida o\'ynayapsiz 👾');
  }

  initSocket(user ? api.getToken() : null);
  goToLobby();
}

// ── Go to Lobby ────────────────────────────────────────────
function goToLobby() {
  homePage.style.display    = 'none';
  lobbySection.style.display = 'flex';
  gameWrapper.style.display  = 'none';

  // Pre-fill name
  const nameInput = document.getElementById('nameInput');
  if (nameInput && state.currentUser) {
    nameInput.value = state.currentUser.display_name || state.currentUser.username;
  }

  // Setup color picker
  const savedColor = state.currentUser?.color || COLORS[0];
  const savedIdx = COLORS.indexOf(savedColor);
  ui.initColorPicker(COLORS, COLOR_NAMES, savedIdx >= 0 ? savedIdx : 0);

  // Lobby nav user area
  if (state.currentUser) {
    renderNavUser2(state.currentUser);
  } else {
    const el = document.getElementById('navPlayerInfo2');
    if (el) el.innerHTML = '<div class="guest-chip-sm">👾 Guest</div>';
  }

  updateSetupAvatar();
}

// ── Back to Home ───────────────────────────────────────────
document.getElementById('backHomeBtn')?.addEventListener('click', () => {
  homePage.style.display     = 'flex';
  lobbySection.style.display = 'none';
});

// ── Nav Rendering ──────────────────────────────────────────
function renderNavUserHome(user) {
  const lvl = getLevelProgress(user.xp || 0);
  const el  = document.getElementById('navPlayerInfo');
  if (!el) return;

  const avatarHTML = user.avatar
    ? `<div class="nav-avatar" style="background:${user.color}"><img src="${user.avatar}" alt="${user.display_name || user.username}"></div>`
    : `<div class="nav-avatar" style="background:${user.color}">${(user.display_name || user.username)[0].toUpperCase()}</div>`;

  el.innerHTML = `
    <div class="nav-user-chip">
      ${avatarHTML}
      <div class="nav-user-text">
        <span class="nav-username">${user.display_name || user.username}</span>
        <span class="nav-level" style="color:${LEVEL_COLORS[lvl.level]}">Lv.${lvl.level} · ${lvl.name}</span>
      </div>
      <div class="nav-mini-stats">
        <span>🏆${user.wins || 0}</span>
        <span>💀${user.losses || 0}</span>
      </div>
    </div>`;
}

function renderNavUser(user) {
  renderNavUserHome(user);
  renderNavUser2(user);
}

function renderNavUser2(user) {
  const lvl = getLevelProgress(user.xp || 0);
  const el  = document.getElementById('navPlayerInfo2');
  if (!el) return;

  const avatarHTML = user.avatar
    ? `<div class="nav-avatar-sm" style="background:${user.color}"><img src="${user.avatar}" alt="${user.display_name || user.username}"></div>`
    : `<div class="nav-avatar-sm" style="background:${user.color}">${(user.display_name || user.username)[0].toUpperCase()}</div>`;

  el.innerHTML = `
    <div class="nav-user-chip-sm">
      ${avatarHTML}
      <span class="nav-username-sm">${user.display_name || user.username}</span>
      <span class="nav-level-sm" style="color:${LEVEL_COLORS[lvl.level]}">Lv.${lvl.level}</span>
    </div>`;
}

// ── Auto-login ─────────────────────────────────────────────
(async () => {
  const token = api.getToken();
  const cachedUser = api.getUser();
  if (token && cachedUser) {
    try {
      const freshUser = await api.fetchMe();
      state.currentUser = freshUser;
      state.isGuest = false;
      // Show user elements on home page
      document.getElementById('guestNavBtns').style.display  = 'none';
      document.getElementById('userNavBtns').style.display   = 'flex';
      document.getElementById('heroGuestBtns').style.display = 'none';
      document.getElementById('heroUserBtns').style.display  = 'flex';
      renderNavUserHome(freshUser);
      loadFriendBadge();
      initSocket(token);
    } catch {
      api.removeToken();
    }
  }
})();

// ── Logout ─────────────────────────────────────────────────
function handleLogout() {
  if (!confirm('Chiqishni xohlaysizmi?')) return;
  api.logout();
  window.location.reload();
}

document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
document.getElementById('logoutBtnLobby')?.addEventListener('click', handleLogout);

// ── Lobby Nav Buttons ──────────────────────────────────────
document.getElementById('leaderboardBtn')?.addEventListener('click', openLeaderboard);
document.getElementById('leaderboardBtnHome')?.addEventListener('click', openLeaderboard);

document.getElementById('friendsBtn')?.addEventListener('click', toggleFriends);
document.getElementById('friendsBtnHome')?.addEventListener('click', toggleFriends);

document.getElementById('historyBtn')?.addEventListener('click', openHistory);
document.getElementById('historyBtnHome')?.addEventListener('click', openHistory);

// ── Color + Avatar ─────────────────────────────────────────
function updateSetupAvatar() {
  const avatar = document.getElementById('setupAvatar');
  const nameInput = document.getElementById('nameInput');
  if (!avatar) return;
  const name  = nameInput?.value || 'P';
  const color = ui.getSelectedColor ? ui.getSelectedColor() : COLORS[0];
  avatar.style.background = color;
  
  if (state.currentUser && state.currentUser.avatar) {
    avatar.innerHTML = `<img src="${state.currentUser.avatar}" alt="${name}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; display:block;">`;
    avatar.textContent = '';
  } else {
    avatar.innerHTML = '';
    avatar.textContent = name[0]?.toUpperCase() || 'P';
  }
}

document.getElementById('nameInput')?.addEventListener('input', updateSetupAvatar);

// ── Settings Modal Logic ────────────────────────────────────
let selectedSettingsColor = COLORS[0];
let currentSettingsAvatar = null; // holds base64 string

const settingsModal = document.getElementById('settingsModal');
const settingsAvatarPreview = document.getElementById('settingsAvatarPreview');
const avatarFileInput = document.getElementById('avatarFileInput');
const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
const removeAvatarBtn = document.getElementById('removeAvatarBtn');
const settingsDisplayName = document.getElementById('settingsDisplayName');
const settingsColorRow = document.getElementById('settingsColorRow');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const settingsError = document.getElementById('settingsError');
const settingsSuccess = document.getElementById('settingsSuccess');

// Emoji selectors
const emojiHappy = document.getElementById('emojiHappy');
const emojiNeutral = document.getElementById('emojiNeutral');
const emojiSad = document.getElementById('emojiSad');
const emojiMelee = document.getElementById('emojiMelee');
const emojiGun = document.getElementById('emojiGun');
const emojiSniper = document.getElementById('emojiSniper');

// Preset data mapping
const EMOJI_PRESETS = {
  classic: { happy: '😊', neutral: '😐', sad: '😢', melee: '😈', gun: '😡', sniper: '🤬' },
  cool: { happy: '😎', neutral: '🧐', sad: '🥺', melee: '🥷', gun: '🤠', sniper: '🧐' },
  scary: { happy: '😈', neutral: '👽', sad: '💀', melee: '👹', gun: '🤖', sniper: '💀' },
  funny: { happy: '😜', neutral: '🤡', sad: '🥴', melee: '😼', gun: '🦁', sniper: '🦅' }
};

// Preset button handlers
document.querySelectorAll('.emoji-preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const presetName = btn.dataset.preset;
    const preset = EMOJI_PRESETS[presetName];
    if (preset) {
      emojiHappy.value = preset.happy;
      emojiNeutral.value = preset.neutral;
      emojiSad.value = preset.sad;
      emojiMelee.value = preset.melee;
      emojiGun.value = preset.gun;
      emojiSniper.value = preset.sniper;
      
      // Update UI selection classes
      document.querySelectorAll('.emoji-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  });
});

// Update settings avatar preview display
function updateSettingsAvatarPreview(user) {
  if (!settingsAvatarPreview) return;
  const name = settingsDisplayName?.value || user?.display_name || user?.username || 'U';
  const color = selectedSettingsColor || user?.color || COLORS[0];
  
  settingsAvatarPreview.style.background = color;
  
  if (currentSettingsAvatar) {
    settingsAvatarPreview.style.backgroundImage = `url(${currentSettingsAvatar})`;
    settingsAvatarPreview.style.backgroundSize = 'cover';
    settingsAvatarPreview.style.backgroundPosition = 'center';
    settingsAvatarPreview.textContent = '';
  } else {
    settingsAvatarPreview.style.backgroundImage = 'none';
    settingsAvatarPreview.textContent = name[0]?.toUpperCase() || 'U';
  }
}

// Live sync settings avatar preview on display name changes
settingsDisplayName?.addEventListener('input', () => {
  if (!currentSettingsAvatar && state.currentUser) {
    updateSettingsAvatarPreview(state.currentUser);
  }
});

// Settings buttons click listeners
document.getElementById('settingsBtnHome')?.addEventListener('click', openSettingsModal);
document.getElementById('settingsBtnLobby')?.addEventListener('click', openSettingsModal);
closeSettingsBtn?.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});

// Rules Modal logic
const rulesModal = document.getElementById('rulesModal');
document.getElementById('rulesBtn')?.addEventListener('click', () => {
  if (rulesModal) rulesModal.style.display = 'flex';
});
document.getElementById('closeRulesBtn')?.addEventListener('click', () => {
  if (rulesModal) rulesModal.style.display = 'none';
});

function openSmileyCreator() {
  if (!api.isAuthenticated()) {
    showToast("Smaylik yaratish uchun avval tizimga kiring yoki ro'yxatdan o'ting", 'info');
    clearAuthErrors();
    openModal('registerModal');
    renderAuthColorPicker();
    return;
  }
  smileyEditor.open();
}

document.getElementById('homeSmileyPromo')?.addEventListener('click', openSmileyCreator);

// Initialize bouncing animation for widgets on the right side
initBouncingWidgets();

// Random smiley cycler for promo
const promoSmiley = document.getElementById('promoRandomSmiley');
if (promoSmiley) {
  const promoEmojis = ['😊', '😂', '😎', '🤪', '🤩', '😡', '😭', '🥺', '😈'];
  setInterval(() => {
    const nextEmoji = promoEmojis[Math.floor(Math.random() * promoEmojis.length)];
    promoSmiley.textContent = nextEmoji;
  }, 2000);
}
document.getElementById('settingsSmileyCreatorBtn')?.addEventListener('click', () => {
  settingsModal.style.display = 'none';
  openSmileyCreator();
});

async function openSettingsModal() {
  if (!api.isAuthenticated()) {
    return showToast("Profil sozlamalari uchun tizimga kiring", 'info');
  }
  
  if (settingsError) { settingsError.textContent = ''; settingsError.style.display = 'none'; }
  if (settingsSuccess) { settingsSuccess.textContent = ''; settingsSuccess.style.display = 'none'; }
  
  // Deactivate any preset highlights initially
  document.querySelectorAll('.emoji-preset-btn').forEach(b => b.classList.remove('active'));

  try {
    const user = await api.fetchMe();
    state.currentUser = user;
    renderNavUser(user);
    
    // Fill settings inputs
    settingsDisplayName.value = user.display_name || user.username;
    selectedSettingsColor = user.color || COLORS[0];
    currentSettingsAvatar = user.avatar || null;
    
    // Render color row inside settings
    renderSettingsColorPicker();
    updateSettingsAvatarPreview(user);
    
    // Fill emoji dropdowns
    let customEmojis = {};
    if (user.custom_emojis) {
      try {
        customEmojis = typeof user.custom_emojis === 'string' ? JSON.parse(user.custom_emojis) : user.custom_emojis;
      } catch (e) {
        console.error("Failed to parse custom emojis:", e);
      }
    }
    
    emojiHappy.value = customEmojis.happy || '😊';
    emojiNeutral.value = customEmojis.neutral || '😐';
    emojiSad.value = customEmojis.sad || '😢';
    emojiMelee.value = customEmojis.melee || '😈';
    emojiGun.value = customEmojis.gun || '😡';
    emojiSniper.value = customEmojis.sniper || '🤬';
    
    // Open settings modal
    settingsModal.style.display = 'flex';
  } catch (err) {
    showToast("Profil ma'lumotlarini yuklashda xatolik yuz berdi: " + err.message, 'error');
  }
}

function renderSettingsColorPicker() {
  if (!settingsColorRow) return;
  settingsColorRow.innerHTML = '';
  COLORS.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'color-btn' + (c === selectedSettingsColor ? ' selected' : '');
    btn.style.background = c;
    btn.title = COLOR_NAMES[i] || c;
    btn.onclick = () => {
      selectedSettingsColor = c;
      settingsColorRow.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      updateSettingsAvatarPreview(state.currentUser);
    };
    settingsColorRow.appendChild(btn);
  });
}

// Avatar upload events
uploadAvatarBtn?.addEventListener('click', () => {
  avatarFileInput?.click();
});

avatarFileInput?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    alert("Iltimos, faqat rasm faylini tanlang!");
    return;
  }
  
  // 2MB max file size check
  if (file.size > 2 * 1024 * 1024) {
    alert("Rasm fayli hajmi 2MB dan oshmasligi kerak!");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (event) => {
    currentSettingsAvatar = event.target.result;
    updateSettingsAvatarPreview(state.currentUser);
  };
  reader.readAsDataURL(file);
});

removeAvatarBtn?.addEventListener('click', () => {
  currentSettingsAvatar = null;
  avatarFileInput.value = '';
  updateSettingsAvatarPreview(state.currentUser);
});

// Save settings handler
saveSettingsBtn?.addEventListener('click', async () => {
  const displayName = settingsDisplayName.value.trim();
  if (displayName.length < 3 || displayName.length > 20) {
    if (settingsError) {
      settingsError.textContent = 'Ko\'rsatiladigan ism 3-20 belgidan iborat bo\'lishi kerak';
      settingsError.style.display = 'block';
    }
    return;
  }
  
  saveSettingsBtn.disabled = true;
  saveSettingsBtn.textContent = 'Saqlanmoqda...';
  if (settingsError) { settingsError.textContent = ''; settingsError.style.display = 'none'; }
  if (settingsSuccess) { settingsSuccess.textContent = ''; settingsSuccess.style.display = 'none'; }
  
  try {
    const customEmojis = {
      happy: emojiHappy.value,
      neutral: emojiNeutral.value,
      sad: emojiSad.value,
      melee: emojiMelee.value,
      gun: emojiGun.value,
      sniper: emojiSniper.value
    };
    
    const updatedUser = await api.updateProfile(
      displayName,
      selectedSettingsColor,
      currentSettingsAvatar,
      customEmojis
    );
    
    state.currentUser = updatedUser;
    renderNavUser(updatedUser);
    
    // Update lobby setup if displayed
    const nameInput = document.getElementById('nameInput');
    if (nameInput) {
      nameInput.value = updatedUser.display_name || updatedUser.username;
    }
    
    updateSetupAvatar();
    
    if (settingsSuccess) {
      settingsSuccess.textContent = 'Profil muvaffaqiyatli yangilandi! 🎉';
      settingsSuccess.style.display = 'block';
    }
    
    showToast('Profil muvaffaqiyatli yangilandi!');
    
    // Automatically close settings modal after 1.5 seconds
    setTimeout(() => {
      settingsModal.style.display = 'none';
    }, 1500);
  } catch (err) {
    if (settingsError) {
      settingsError.textContent = err.message || 'Xatolik yuz berdi';
      settingsError.style.display = 'block';
    }
  } finally {
    saveSettingsBtn.disabled = false;
    saveSettingsBtn.textContent = 'Saqlash';
  }
});


// ── Keyboard & Mouse Input ─────────────────────────────────
const keys = {};
canvas.addEventListener('click', () => canvas.focus());

canvas.addEventListener('mousedown', e => {
  if (state.status !== 'playing' || !state.player || !state.player.alive) return;
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  const dx = clickX - canvas.width / 2;
  const dy = clickY - canvas.height / 2;
  const angle = Math.atan2(dy, dx);
  socket?.emit('shoot', { angle });
});

window.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  keys[e.key] = true;
  checkSendInput();

  if (e.key === ' ' || e.key === 'Spacebar') {
    if (state.status === 'playing' && state.player && state.player.alive) {
      const dx = lastMousePos.x - canvas.width / 2;
      const dy = lastMousePos.y - canvas.height / 2;
      const angle = Math.atan2(dy, dx);
      socket?.emit('shoot', { angle });
    }
  }
});

window.addEventListener('keyup', e => {
  keys[e.key] = false;
  checkSendInput();
});

let lastDx = 0, lastDy = 0;
function checkSendInput() {
  if (state.status !== 'playing' || !state.player || !state.player.alive || !socket) return;
  let dx = 0, dy = 0;
  if (keys['ArrowUp']    || keys['w'] || keys['W']) dy = -1;
  if (keys['ArrowDown']  || keys['s'] || keys['S']) dy =  1;
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) dx = -1;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) dx =  1;
  if (dx !== lastDx || dy !== lastDy) {
    lastDx = dx; lastDy = dy;
    socket?.emit('player_input', { dx, dy });
  }
}

// ── Bot Toggle ─────────────────────────────────────────────
useBotsCheckbox?.addEventListener('change', () => {
  botCountContainer.style.display = useBotsCheckbox.checked ? 'flex' : 'none';
});

// ── Room Actions ───────────────────────────────────────────
createRoomBtn.onclick = () => {
  const name  = document.getElementById('nameInput')?.value.trim();
  const color = ui.getSelectedColor();
  const useBots  = useBotsCheckbox.checked;
  const botCount = parseInt(botCountInput.value) || 0;
  if (!name) return showToast('Ism kiriting!', 'error');
  if (!socket) return showToast('Server bilan ulanish yo\'q', 'error');
  createRoomBtn.disabled = true;
  createRoomBtn.textContent = 'Xona yaratilmoqda...';
  socket.emit('create_room', { name, color, useBots, botCount });
};

joinRoomBtn.onclick = () => {
  const name  = document.getElementById('nameInput')?.value.trim();
  const color = ui.getSelectedColor();
  const roomCode = roomCodeInput.value.trim();
  if (!name) return showToast('Ism kiriting!', 'error');
  if (roomCode.length !== 4) return showToast("Xona kodi 4 ta raqamdan iborat bo'lishi kerak!", 'error');
  if (!socket) return showToast('Server bilan ulanish yo\'q', 'error');
  joinRoomBtn.disabled = true;
  joinRoomBtn.textContent = "Qo'shilinmoqda...";
  socket.emit('join_room', { name, color, roomCode });
};

ui.startBtn.onclick = () => socket?.emit('start_game_request');

leaveRoomBtn.onclick = () => {
  socket?.disconnect();
  initSocket(state.currentUser ? api.getToken() : null);
  lobbySetup.style.display  = 'flex';
  lobbyWaiting.style.display = 'none';
};

ui.restartBtn.onclick = () => {
  ui.overlay.style.display   = 'none';
  gameWrapper.style.display  = 'none';
  lobbySection.style.display = 'flex';
  lobbySetup.style.display   = 'none';
  lobbyWaiting.style.display = 'flex';
};

if (soloExitBtn) {
  soloExitBtn.onclick = () => {
    if (confirm("Haqiqatan ham o'yinni tark etmoqchimisiz?")) {
      socket?.disconnect();
      initSocket(state.currentUser ? api.getToken() : null);
      
      // Reset UI back to lobby setup
      ui.overlay.style.display   = 'none';
      gameWrapper.style.display  = 'none';
      lobbySection.style.display = 'flex';
      lobbySetup.style.display   = 'flex';
      lobbyWaiting.style.display = 'none';
      
      // Stop animation
      state.running = false;
      if (state.animId) cancelAnimationFrame(state.animId);
      
      if (soloControls) soloControls.style.display = 'none';
    }
  };
}

if (soloRestartBtn) {
  soloRestartBtn.onclick = () => {
    if (confirm("O'yinni qayta boshlashni xohlaysizmi?")) {
      socket?.emit('restart_game');
    }
  };
}

document.getElementById('copyCodeBtn')?.addEventListener('click', () => {
  const code = displayRoomCode?.textContent;
  if (code && code !== '----') {
    navigator.clipboard.writeText(code).then(() => showToast('Kod nusxalandi! 📋'));
  }
});

// ── Friends Panel ──────────────────────────────────────────
const friendsPanel = new FriendsPanel();

// ── Smiley Editor ──────────────────────────────────────────
const smileyEditor = new SmileyEditor();
smileyEditor.init();

function toggleFriends() {
  if (!api.isAuthenticated()) {
    return showToast("Do'stlar tizimi uchun tizimga kiring", 'info');
  }
  friendsPanel.toggle();
  const backdrop = document.getElementById('panelBackdrop');
  if (backdrop) backdrop.style.display = friendsPanel.isOpen ? 'block' : 'none';
}

document.getElementById('panelBackdrop')?.addEventListener('click', () => {
  friendsPanel.close();
  document.getElementById('panelBackdrop').style.display = 'none';
});

// ── Leaderboard ────────────────────────────────────────────
async function openLeaderboard() {
  const modal   = document.getElementById('leaderboardModal');
  const content = document.getElementById('leaderboardContent');
  modal.style.display = 'flex';
  content.innerHTML = '<div class="loading-spinner">Yuklanmoqda...</div>';

  try {
    const leaders = await api.getLeaderboard();
    const meId    = state.currentUser?.id;

    content.innerHTML = leaders.map((u, i) => {
      const rank  = i + 1;
      const lvl   = getLevelProgress(u.xp || 0);
      const isMe  = u.id === meId;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
        const avatarHTML = u.avatar
          ? `<div class="lb-avatar" style="background:${u.color}"><img src="${u.avatar}" alt="${u.display_name || u.username}"></div>`
          : `<div class="lb-avatar" style="background:${u.color}">${(u.display_name || u.username)[0].toUpperCase()}</div>`;

        return `
          <div class="lb-row ${isMe ? 'lb-me' : ''}">
            <span class="lb-rank">${medal}</span>
            ${avatarHTML}
            <div class="lb-info">
              <span class="lb-name">${u.display_name || u.username} ${isMe ? '<span class="you-badge">Siz</span>' : ''}</span>
              <span class="lb-level" style="color:${LEVEL_COLORS[lvl.level]}">Lv.${lvl.level} ${LEVEL_NAMES[lvl.level]}</span>
            </div>
          <div class="lb-stats">
            <span class="lb-wins">🏆 ${u.wins}</span>
            <span class="lb-games">${u.games_played} o'yin</span>
          </div>
        </div>`;
    }).join('') || '<div class="empty-state">Hali hech kim o\'ynamagan</div>';
  } catch (err) {
    content.innerHTML = `<div class="error-state">${err.message}</div>`;
  }
}

document.getElementById('closeLeaderboardBtn')?.addEventListener('click', () => {
  document.getElementById('leaderboardModal').style.display = 'none';
});

// ── History ────────────────────────────────────────────────
async function openHistory() {
  if (!api.isAuthenticated()) {
    return showToast("Tarixni ko'rish uchun tizimga kiring", 'info');
  }
  const modal = document.getElementById('historyModal');
  modal.style.display = 'flex';
  
  // Set active tab to games
  const tabGames = document.getElementById('historyTabGames');
  const tabSessions = document.getElementById('historyTabSessions');
  if (tabGames) tabGames.classList.add('active');
  if (tabSessions) tabSessions.classList.remove('active');
  
  const hContent = document.getElementById('historyContent');
  const sContent = document.getElementById('sessionsContent');
  if (hContent) hContent.style.display = 'flex';
  if (sContent) sContent.style.display = 'none';

  await loadGameHistory();
}

async function loadGameHistory() {
  const content = document.getElementById('historyContent');
  if (!content) return;
  content.innerHTML = '<div class="loading-spinner">Yuklanmoqda...</div>';

  try {
    const games = await api.getGameHistory();
    if (!games.length) {
      content.innerHTML = '<div class="empty-state">Hali hech qanday o\'yin o\'ynamadingiz</div>';
      return;
    }
    content.innerHTML = games.map(g => {
      const rc   = g.result === 'win' ? 'win' : g.result === 'draw' ? 'draw' : 'loss';
      const rt   = g.result === 'win' ? '🏆 G\'olib' : g.result === 'draw' ? '🤝 Durrang' : '💀 Mag\'lub';
      const dur  = g.duration_seconds ? `${Math.floor(g.duration_seconds/60)}:${String(g.duration_seconds%60).padStart(2,'0')}` : '—';
      return `
        <div class="history-row">
          <div class="history-result-badge ${rc}">${rt}</div>
          <div class="history-info">
            <span class="history-room">Xona: ${g.room_code}</span>
            <span class="history-date">${formatDate(g.ended_at)}</span>
          </div>
          <div class="history-meta">
            <span>👥 ${g.player_count} o'yinchi</span>
            <span>⏱ ${dur}</span>
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    content.innerHTML = `<div class="error-state">${err.message}</div>`;
  }
}

async function loadSessions() {
  const content = document.getElementById('sessionsContent');
  if (!content) return;
  content.innerHTML = '<div class="loading-spinner">Yuklanmoqda...</div>';

  try {
    const sessions = await api.getLoginSessions();
    if (!sessions.length) {
      content.innerHTML = '<div class="empty-state">Hali hech qanday faol seans topilmadi</div>';
      return;
    }
    content.innerHTML = sessions.map(s => {
      const isMobile = /mobile|android|iphone|ipad/i.test(s.device_info);
      const icon = isMobile ? '📱' : '💻';
      
      // Clean up browser/OS name from user-agent for cleaner display
      let displayDevice = s.device_info;
      if (s.device_info.includes('Windows NT 10.0')) displayDevice = 'Windows 10/11 Desktop';
      else if (s.device_info.includes('Macintosh')) displayDevice = 'macOS Desktop';
      else if (s.device_info.includes('Android')) displayDevice = 'Android Device';
      else if (s.device_info.includes('iPhone')) displayDevice = 'iPhone';
      else if (s.device_info.includes('Linux')) displayDevice = 'Linux Desktop';
      
      // Extract browser if possible
      let browser = '';
      if (s.device_info.includes('Firefox/')) browser = 'Firefox';
      else if (s.device_info.includes('Edg/')) browser = 'Edge';
      else if (s.device_info.includes('Chrome/')) browser = 'Chrome';
      else if (s.device_info.includes('Safari/')) browser = 'Safari';

      const deviceString = browser ? `${displayDevice} (${browser})` : displayDevice;

      return `
        <div class="history-row">
          <div style="font-size:24px; display:flex; align-items:center; justify-content:center; padding: 0 4px;">${icon}</div>
          <div class="history-info">
            <span class="history-room" style="font-size:13px; color:var(--text); word-break:break-all;">${deviceString}</span>
            <span class="history-date">IP: ${s.ip_address || '127.0.0.1'}</span>
          </div>
          <div class="history-meta" style="align-items:flex-end;">
            <span style="font-size:11px; color:var(--text3);">${formatDate(s.logged_in_at)}</span>
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    content.innerHTML = `<div class="error-state">${err.message}</div>`;
  }
}

document.getElementById('historyTabGames')?.addEventListener('click', () => {
  document.getElementById('historyTabGames').classList.add('active');
  document.getElementById('historyTabSessions').classList.remove('active');
  document.getElementById('historyContent').style.display = 'flex';
  document.getElementById('sessionsContent').style.display = 'none';
  loadGameHistory();
});

document.getElementById('historyTabSessions')?.addEventListener('click', () => {
  document.getElementById('historyTabGames').classList.remove('active');
  document.getElementById('historyTabSessions').classList.add('active');
  document.getElementById('historyContent').style.display = 'none';
  document.getElementById('sessionsContent').style.display = 'flex';
  loadSessions();
});

document.getElementById('closeHistoryBtn')?.addEventListener('click', () => {
  document.getElementById('historyModal').style.display = 'none';
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.style.display = 'none';
  });
});

// ── Lobby Players ──────────────────────────────────────────
function renderLobbyPlayers(serverState) {
  lobbyPlayersList.innerHTML = '';
  serverState.lobbyPlayers.forEach(lp => {
    const row = document.createElement('div');
    row.className = 'lobby-p-row';
    row.style.borderLeft = `4px solid ${lp.color}`;
    const isSiz = lp.id === socket.id ? '<span style="font-size:11px;opacity:0.7;"> (Siz)</span>' : '';
    const avatarHTML = lp.avatar
      ? `<div class="lp-avatar" style="background:${lp.color}"><img src="${lp.avatar}" alt="${lp.name}"></div>`
      : `<div class="lp-avatar" style="background:${lp.color}">${lp.name[0].toUpperCase()}</div>`;

    row.innerHTML = `
      ${avatarHTML}
      <span style="color:${lp.color};font-weight:600;">${lp.name}${isSiz}</span>
      ${lp.isHost ? '<span class="p-badge">Host</span>' : ''}`;
    lobbyPlayersList.appendChild(row);
  });

  roomSettingsInfo.textContent = serverState.useBots
    ? `Botlar: Yoqilgan (${serverState.botCount} ta)` : "Botlar: O'chirilgan";

  if (state.isHost) {
    ui.startBtn.style.display    = 'block';
    waitingStatusMsg.style.display = 'none';
    ui.startBtn.disabled    = state.status === 'countdown';
    ui.startBtn.textContent = state.status === 'countdown'
      ? `Boshlanmoqda: ${serverState.countdownSeconds}s` : "▶ O'yinni boshlash";
  } else {
    ui.startBtn.style.display    = 'none';
    waitingStatusMsg.style.display = 'block';
    if (state.status === 'countdown') {
      waitingStatusMsg.textContent = `O'yin boshlanmoqda: ${serverState.countdownSeconds}s`;
      waitingStatusMsg.style.color = '#ff2a5f';
    } else {
      waitingStatusMsg.textContent = "Xona egasi o'yinni boshlashini kuting...";
      waitingStatusMsg.style.color = '#4da6ff';
    }
  }
}

// ── Helpers ────────────────────────────────────────────────
function resetRoomBtns() {
  createRoomBtn.disabled = false;
  createRoomBtn.textContent = '⚔️ Yangi xona yaratish';
  joinRoomBtn.disabled = false;
  joinRoomBtn.textContent = 'Kirish';
}

async function loadFriendBadge() {
  if (!api.isAuthenticated()) return;
  try {
    const { received } = await api.getFriendRequests();
    const count = received.length;
    ['friendRequestsBadge','friendRequestsBadge2'].forEach(id => {
      const badge = document.getElementById(id);
      if (badge) { badge.textContent = count || ''; badge.style.display = count ? 'flex' : 'none'; }
    });
  } catch {}
}

setInterval(() => { if (api.isAuthenticated()) loadFriendBadge(); }, 30000);

function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-notif toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// Sound effects on UI interactions via delegation
document.addEventListener('mouseover', e => {
  if (e.target.matches('button, .nav-btn, .text-link, .color-btn, input[type="checkbox"]')) {
    sounds.play('hover', 0.4);
  }
});

document.addEventListener('click', e => {
  if (e.target.matches('button, .nav-btn, .text-link, .color-btn, input[type="checkbox"]')) {
    sounds.play('click');
  }
});

function createHitParticles(x, y, color) {
  for (let i = 0; i < 12; i++) {
    state.particles.push(new GameParticle(x, y, color));
  }
}

function createFloatingText(x, y, text, color) {
  state.floatingTexts.push(new FloatingText(x, y, text, color));
}

// ── Game Loop ──────────────────────────────────────────────
let lastFrameTime = performance.now();

function loop() {
  if (!state.running) return;
  const now = performance.now();
  const dt = Math.min((now - lastFrameTime) / 1000, 0.1); // cap dt at 100ms
  lastFrameTime = now;

  update(dt);
  draw();
  state.animId = requestAnimationFrame(loop);
}

function update(dt) {
  const alive = state.players.filter(p => p.alive).length;
  ui.updateHUD(state.zoneTimer, alive, state.players.length, state.player);
  ui.updatePlayerList(state.players, state.player);

  // Update particles
  state.particles = state.particles.filter(p => {
    p.update(dt);
    return p.life > 0;
  });

  // Update floating texts
  state.floatingTexts = state.floatingTexts.filter(t => {
    t.update(dt);
    return t.life > 0;
  });

  // Update screen shake decay
  if (state.screenShake > 0) {
    state.screenShake -= dt * 30;
    if (state.screenShake < 0) state.screenShake = 0;
  }
}

function draw() {
  // Clear the whole canvas drawing buffer with outer dark screen backdrop color
  ctx.fillStyle = '#080818';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  // Apply screen shake
  if (state.screenShake > 0) {
    const dx = (Math.random() - 0.5) * state.screenShake;
    const dy = (Math.random() - 0.5) * state.screenShake;
    ctx.translate(dx, dy);
  }

  // Camera Translation centered on local player
  let camX = 0;
  let camY = 0;
  if (state.player) {
    camX = canvas.width / 2 - state.player.x;
    camY = canvas.height / 2 - state.player.y;
  } else {
    camX = canvas.width / 2 - GAME_CONFIG.WIDTH / 2;
    camY = canvas.height / 2 - GAME_CONFIG.HEIGHT / 2;
  }
  ctx.translate(camX, camY);

  // Draw actual arena background
  ctx.fillStyle = '#111124';
  ctx.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

  // Grid background within the map bounds
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= GAME_CONFIG.WIDTH; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GAME_CONFIG.HEIGHT); ctx.stroke();
  }
  for (let y = 0; y <= GAME_CONFIG.HEIGHT; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GAME_CONFIG.WIDTH, y); ctx.stroke();
  }

  // Draw Map Boundary Outer Red Border Glow
  ctx.save();
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 4;
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#e94560';
  ctx.strokeRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
  ctx.restore();

  // Items
  state.items.forEach(it => it.draw(ctx));

  // Red Zone (Storm) Overlay
  ctx.save();
  ctx.fillStyle = 'rgba(10, 10, 36, 0.65)';
  ctx.beginPath();
  ctx.rect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
  ctx.arc(state.zoneCx, state.zoneCy, state.zoneR, 0, Math.PI * 2, true);
  ctx.fill('evenodd');
  ctx.restore();

  // Zone border pulsing glow
  ctx.save();
  const pulseFactor = 1 + Math.sin(performance.now() / 200) * 0.05;
  ctx.strokeStyle = `rgba(77, 166, 255, ${0.6 + Math.sin(performance.now() / 150) * 0.2})`;
  ctx.lineWidth = 2.5 * pulseFactor;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(state.zoneCx, state.zoneCy, state.zoneR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Draw Bouncing Bombs
  if (state.bombs) {
    state.bombs.forEach(bomb => {
      ctx.save();
      ctx.fillStyle = 'rgba(233, 69, 96, 0.15)';
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#e94560';
      ctx.beginPath();
      ctx.arc(bomb.x, bomb.y, bomb.radius || 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💣', bomb.x, bomb.y);
      ctx.restore();
    });
  }

  // Draw Bullets
  if (state.bullets) {
    state.bullets.forEach(b => {
      ctx.save();
      ctx.fillStyle = '#ffeb3b';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius || 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // Players
  state.players.forEach(p => {
    const isMain = state.player && p.id === state.player.id;
    p.draw(ctx, isMain);
  });

  // Particles
  state.particles.forEach(p => p.draw(ctx));

  // Floating Texts
  state.floatingTexts.forEach(t => t.draw(ctx));

  ctx.restore();
}
