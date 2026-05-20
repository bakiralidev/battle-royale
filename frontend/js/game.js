// Battle Royale Main Game Engine (Multiplayer Client)
import { COLORS, COLOR_NAMES, GAME_CONFIG } from './config.js';
import { UIManager } from './ui.js';
import { Player } from './player.js';
import { Item } from './item.js';

// Initialize Socket.IO client
const socket = io();

// Instantiate UI Manager
const ui = new UIManager();

// Canvas context setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State variables
const state = {
  running: false,
  status: 'lobby',
  player: null,
  players: [],
  items: [],
  zoneR: 0,
  zoneCx: GAME_CONFIG.WIDTH / 2,
  zoneCy: GAME_CONFIG.HEIGHT / 2,
  zoneTimer: GAME_CONFIG.ZONE_DURATION,
  animId: null,
  
  // Room specific states
  roomCode: null,
  isHost: false,
  hostId: null
};

// DOM References for Room Features
const lobbySetup = document.getElementById('lobbySetup');
const lobbyWaiting = document.getElementById('lobbyWaiting');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');
const useBotsCheckbox = document.getElementById('useBotsCheckbox');
const botCountInput = document.getElementById('botCountInput');
const botCountContainer = document.getElementById('botCountContainer');
const roomCodeInput = document.getElementById('roomCodeInput');
const displayRoomCode = document.getElementById('displayRoomCode');
const lobbyPlayersList = document.getElementById('lobbyPlayersList');
const roomSettingsInfo = document.getElementById('roomSettingsInfo');
const waitingStatusMsg = document.getElementById('waitingStatusMsg');

// Keyboard state map
const keys = {};

// Handle window resizing or canvas focus
canvas.addEventListener('click', () => canvas.focus());

// Input Listeners
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
  keys[e.key] = true;
  checkSendInput();
});

window.addEventListener('keyup', e => {
  if (keys[e.key]) {
    keys[e.key] = false;
  }
  checkSendInput();
});

// Configure Play Buttons from UI
ui.initColorPicker(COLORS, COLOR_NAMES, 0);

// Toggle bot inputs based on checkbox
useBotsCheckbox.addEventListener('change', () => {
  if (useBotsCheckbox.checked) {
    botCountContainer.style.display = 'flex';
  } else {
    botCountContainer.style.display = 'none';
  }
});

// Create Room Action
createRoomBtn.onclick = () => {
  const name = ui.getPlayerName();
  const color = ui.getSelectedColor();
  const useBots = useBotsCheckbox.checked;
  const botCount = parseInt(botCountInput.value) || 0;

  createRoomBtn.disabled = true;
  createRoomBtn.textContent = 'Xona yaratilmoqda...';

  socket.emit('create_room', { name, color, useBots, botCount });
};

// Join Room Action
joinRoomBtn.onclick = () => {
  const name = ui.getPlayerName();
  const color = ui.getSelectedColor();
  const roomCode = roomCodeInput.value.trim();

  if (roomCode.length !== 4) {
    alert("Xona kodi 4 ta raqamdan iborat bo'lishi kerak!");
    return;
  }

  joinRoomBtn.disabled = true;
  joinRoomBtn.textContent = 'Qo\'shilinmoqda...';

  socket.emit('join_room', { name, color, roomCode });
};

// Start Match Action (Host only)
ui.startBtn.onclick = () => {
  socket.emit('start_game_request');
};

// Leave Room / Cancel Action
leaveRoomBtn.onclick = () => {
  // Reloading the page cleanly resets socket room ties on server and UI states locally
  window.location.reload();
};

ui.restartBtn.onclick = () => {
  // Hide overlays and display the waiting room again
  ui.overlay.style.display = 'none';
  ui.gameWrapper.style.display = 'none';
  ui.lobby.style.display = 'flex';
  lobbySetup.style.display = 'none';
  lobbyWaiting.style.display = 'flex';
};

// Track last sent movement inputs to avoid flooding sockets
let lastDx = 0;
let lastDy = 0;

function checkSendInput() {
  if (state.status !== 'playing' || !state.player || !state.player.alive) {
    return;
  }
  
  let dx = 0;
  let dy = 0;

  if (keys['ArrowUp'] || keys['w'] || keys['W']) dy = -1;
  if (keys['ArrowDown'] || keys['s'] || keys['S']) dy = 1;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx = -1;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) dx = 1;

  if (dx !== lastDx || dy !== lastDy) {
    lastDx = dx;
    lastDy = dy;
    socket.emit('player_input', { dx, dy });
  }
}

// ==========================================
// Socket.IO Event Handlers
// ==========================================

socket.on('init_config', (config) => {
  console.log('Received server config:', config);
});

socket.on('room_joined', ({ roomCode, isHost, hostId }) => {
  state.roomCode = roomCode;
  state.isHost = isHost;
  state.hostId = hostId;

  // Toggle UI sections
  lobbySetup.style.display = 'none';
  lobbyWaiting.style.display = 'flex';
  displayRoomCode.textContent = roomCode;

  // Reset lobby actions buttons
  createRoomBtn.disabled = false;
  createRoomBtn.textContent = 'Yangi xona yaratish';
  joinRoomBtn.disabled = false;
  joinRoomBtn.textContent = 'Qo\'shilish';
});

socket.on('room_error', (msg) => {
  alert(msg);
  createRoomBtn.disabled = false;
  createRoomBtn.textContent = 'Yangi xona yaratish';
  joinRoomBtn.disabled = false;
  joinRoomBtn.textContent = 'Qo\'shilish';
});

socket.on('countdown_tick', (data) => {
  if (state.isHost) {
    ui.startBtn.disabled = true;
    ui.startBtn.textContent = `Boshlanmoqda: ${data.seconds}s`;
  } else {
    waitingStatusMsg.textContent = `O'yin boshlanmoqda: ${data.seconds}s`;
    waitingStatusMsg.style.color = '#ff2a5f';
  }
});

socket.on('countdown_cancelled', () => {
  ui.startBtn.disabled = false;
  ui.startBtn.textContent = "O'yinni boshlash";
  waitingStatusMsg.textContent = "Xona egasi o'yinni boshlashini kuting...";
  waitingStatusMsg.style.color = '#4da6ff';
});

socket.on('game_started', () => {
  console.log('Match started by server');
  ui.showGame();
  canvas.focus();
  
  state.running = true;
  
  lastDx = 0;
  lastDy = 0;

  if (state.animId) {
    cancelAnimationFrame(state.animId);
  }
  loop();
});

socket.on('state_update', (serverState) => {
  state.status = serverState.status;
  state.players = serverState.players.map(p => new Player(p));
  state.items = serverState.items.map(it => new Item(it));
  
  state.zoneR = serverState.zone.r;
  state.zoneCx = serverState.zone.cx;
  state.zoneCy = serverState.zone.cy;
  state.zoneTimer = serverState.zone.timer;

  // Find client's own player and host state
  state.player = state.players.find(p => p.id === socket.id);
  state.isHost = (socket.id === serverState.hostId);

  // Update Lobby Player List in UI if in lobby state
  if (state.status === 'lobby' || state.status === 'countdown') {
    lobbyPlayersList.innerHTML = '';
    serverState.lobbyPlayers.forEach(lp => {
      const row = document.createElement('div');
      row.className = 'lobby-p-row';
      row.style.borderLeft = `4px solid ${lp.color}`;
      
      const isSiz = lp.id === socket.id ? ' <span style="font-size: 11px; opacity: 0.7;">(Siz)</span>' : '';
      row.innerHTML = `
        <span style="color: ${lp.color}; font-weight: 600;">${lp.name}${isSiz}</span>
        ${lp.isHost ? '<span class="p-badge">Host</span>' : ''}
      `;
      lobbyPlayersList.appendChild(row);
    });

    // Update settings badge text
    if (serverState.useBots) {
      roomSettingsInfo.textContent = `Botlar: Yoqilgan (${serverState.botCount} ta)`;
    } else {
      roomSettingsInfo.textContent = "Botlar: O'chirilgan";
    }

    // Toggle start buttons vs waiting indicators based on host status
    if (state.isHost) {
      ui.startBtn.style.display = 'block';
      waitingStatusMsg.style.display = 'none';
      
      if (state.status === 'countdown') {
        ui.startBtn.disabled = true;
        ui.startBtn.textContent = `Boshlanmoqda: ${serverState.countdownSeconds}s`;
      } else {
        ui.startBtn.disabled = false;
        ui.startBtn.textContent = "O'yinni boshlash";
      }
    } else {
      ui.startBtn.style.display = 'none';
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

  // Update Game ending countdowns if in ended state
  if (state.status === 'ended' && ui.restartBtn.style.display !== 'none') {
    ui.restartBtn.textContent = `Lobbyga qaytish: ${serverState.lobbyResetSeconds}s`;
  }
});

socket.on('combat_event', (data) => {
  if (data.type === 'hit') {
    console.log(`Combat hit: ${data.detail.a.name} hit ${data.detail.b.name}`);
  }
});

socket.on('game_ended', (data) => {
  console.log('Match ended');
  let win = false;
  if (state.player && data.winner && state.player.name === data.winner.name) {
    win = true;
  }
  ui.showEndGame(win, data.msg);
});

socket.on('lobby_reset', () => {
  console.log('Match reset back to lobby waiting room');
  state.running = false;
  if (state.animId) {
    cancelAnimationFrame(state.animId);
  }
  
  // Return players to the waiting lobby interface
  ui.overlay.style.display = 'none';
  ui.gameWrapper.style.display = 'none';
  ui.lobby.style.display = 'flex';
  
  lobbySetup.style.display = 'none';
  lobbyWaiting.style.display = 'flex';

  ui.startBtn.disabled = false;
  ui.startBtn.textContent = "O'yinni boshlash";
  waitingStatusMsg.textContent = "Xona egasi o'yinni boshlashini kuting...";
  waitingStatusMsg.style.color = '#4da6ff';
});

// ==========================================
// Game Loops and Rendering
// ==========================================

function loop() {
  if (!state.running) return;
  update();
  draw();
  state.animId = requestAnimationFrame(loop);
}

function update() {
  const currentAlive = state.players.filter(p => p.alive).length;
  const totalPlayers = state.players.length;
  
  ui.updateHUD(state.zoneTimer, currentAlive, totalPlayers, state.player);
  ui.updatePlayerList(state.players, state.player);
}

function draw() {
  ctx.clearRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

  // Grid Map backdrop
  ctx.fillStyle = '#111124';
  ctx.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < GAME_CONFIG.WIDTH; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GAME_CONFIG.HEIGHT); ctx.stroke();
  }
  for (let y = 0; y < GAME_CONFIG.HEIGHT; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GAME_CONFIG.WIDTH, y); ctx.stroke();
  }

  // Draw items
  state.items.forEach(it => it.draw(ctx));

  // Storm boundary shade logic
  ctx.save();
  ctx.fillStyle = 'rgba(10, 10, 36, 0.65)';
  ctx.beginPath();
  ctx.rect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
  ctx.arc(state.zoneCx, state.zoneCy, state.zoneR, 0, Math.PI * 2, true);
  ctx.fill('evenodd');
  ctx.restore();

  // Storm ring borders
  ctx.save();
  ctx.strokeStyle = 'rgba(77, 166, 255, 0.8)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(state.zoneCx, state.zoneCy, state.zoneR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Draw players
  state.players.forEach(p => {
    const isMain = state.player && p.id === state.player.id;
    p.draw(ctx, isMain);
  });
}
