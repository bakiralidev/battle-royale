// Real-Time Battle Royale Backend Server (Room-based + Database)
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { GameStateManager, GAME_CONFIG } from './game-state.js';
import { db, UserDB, GameDB, SessionDB, FriendDB } from './db.js';
import { verifyToken } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import friendsRouter from './routes/friends.js';
import statsRouter from './routes/stats.js';

// Absolute path resolution for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '../frontend');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/stats', statsRouter);

// Port configuration
const PORT = process.env.PORT || 3000;

// Active rooms map: roomCode -> GameStateManager
const rooms = new Map();

// Socket -> User info mapping
const socketUsers = new Map(); // socketId -> { userId, guestId, displayName, color, deviceInfo, ip }

app.set('io', io);
app.set('socketUsers', socketUsers);
app.set('rooms', rooms);

// Helper to generate a unique 4-digit room code
function generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(code));
  return code;
}

// Helper to get user info for a socket
function getSocketUser(socketId) {
  return socketUsers.get(socketId);
}

// =============================================
// Socket.IO event handler
// =============================================
io.on('connection', (socket) => {
  const deviceInfo = socket.handshake.headers['user-agent'] || 'Unknown';
  const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

  // Authenticate socket on connect via auth token or assign guest
  const token = socket.handshake.auth?.token;
  let userInfo = {
    userId: null,
    guestId: null,
    displayName: null,
    color: '#4da6ff',
    deviceInfo,
    ip
  };

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const user = UserDB.findById(payload.userId);
      if (user) {
        userInfo.userId = user.id;
        userInfo.displayName = user.display_name || user.username;
        userInfo.color = user.color;
        userInfo.avatar = user.avatar;
        userInfo.customEmojis = user.custom_emojis ? JSON.parse(user.custom_emojis) : null;
        userInfo.customSmiley = user.custom_smiley || null;
        userInfo.savedSmileys = user.saved_smileys ? JSON.parse(user.saved_smileys) : [];
        UserDB.updateLastSeen(user.id);
      }
    }
  }

  if (!userInfo.userId) {
    // Guest — assign temp ID
    userInfo.guestId = `guest-${socket.id.slice(0, 8)}`;
  }

  socketUsers.set(socket.id, userInfo);

  // Notify online friends that this user is now online
  if (userInfo.userId) {
    const friends = FriendDB.getFriends(userInfo.userId);
    friends.forEach(f => {
      for (const [sid, info] of socketUsers.entries()) {
        if (info.userId === f.id && sid !== socket.id) {
          const sock = io.sockets.sockets.get(sid);
          if (sock) {
            sock.emit('friend_update', { type: 'status_change', userId: userInfo.userId, isOnline: true });
          }
        }
      }
    });
  }

  console.log(`Connection: ${socket.id} | ${userInfo.userId ? 'User:' + userInfo.displayName : 'Guest'} | ${ip}`);

  // Send initial configs
  socket.emit('init_config', {
    WIDTH: GAME_CONFIG.WIDTH,
    HEIGHT: GAME_CONFIG.HEIGHT,
    ZONE_DURATION: GAME_CONFIG.ZONE_DURATION,
    ZONE_DAMAGE_RATE: GAME_CONFIG.ZONE_DAMAGE_RATE,
    ATTACK_COOLDOWN: GAME_CONFIG.ATTACK_COOLDOWN,
    isAuthenticated: !!userInfo.userId,
    userInfo: userInfo.userId ? {
      userId: userInfo.userId,
      displayName: userInfo.displayName,
      color: userInfo.color,
      avatar: userInfo.avatar,
      customEmojis: userInfo.customEmojis,
      customSmiley: userInfo.customSmiley,
      savedSmileys: userInfo.savedSmileys
    } : null
  });

  // Action 1: Create a room
  socket.on('create_room', ({ name, color, useBots, botCount }) => {
    const roomCode = generateRoomCode();
    const game = new GameStateManager(roomCode, socket.id, useBots, botCount);
    const su = socketUsers.get(socket.id);
    game.addLobbyPlayer(socket.id, name, color, su?.avatar || null, su?.customEmojis || null, su?.customSmiley || null);

    rooms.set(roomCode, game);
    socket.roomCode = roomCode;
    socket.join(roomCode);

    // Update socket user's display name and color from room join
    if (su) { su.displayName = su.displayName || name; su.color = color; }

    console.log(`Room created: ${roomCode} by ${name} (${socket.id}). Bots: ${useBots} (${botCount})`);

    socket.emit('room_joined', {
      roomCode,
      isHost: true,
      hostId: socket.id
    });

    io.to(roomCode).emit('state_update', game.getStatePayload());
  });

  // Action 2: Join an existing room
  socket.on('join_room', ({ name, color, roomCode }) => {
    const code = String(roomCode).trim();
    const game = rooms.get(code);

    if (!game) {
      socket.emit('room_error', "Kiritilgan kod bo'yicha xona topilmadi!");
      return;
    }

    if (game.status !== 'lobby') {
      socket.emit('room_error', "Ushbu xonada o'yin allaqachon boshlangan!");
      return;
    }

    const su = socketUsers.get(socket.id);
    game.addLobbyPlayer(socket.id, name, color, su?.avatar || null, su?.customEmojis || null, su?.customSmiley || null);
    socket.roomCode = code;
    socket.join(code);

    if (su) { su.displayName = su.displayName || name; su.color = color; }

    console.log(`Player ${name} (${socket.id}) joined room: ${code}`);

    socket.emit('room_joined', {
      roomCode: code,
      isHost: false,
      hostId: game.hostId
    });

    io.to(code).emit('state_update', game.getStatePayload());
  });

  // Action 3: Start match (host only)
  socket.on('start_game_request', () => {
    const roomCode = socket.roomCode;
    if (!roomCode) return;

    const game = rooms.get(roomCode);
    if (!game) return;

    if (socket.id !== game.hostId) {
      socket.emit('room_error', "Faqat xona egasi o'yinni boshlay oladi!");
      return;
    }

    if (game.status === 'lobby') {
      console.log(`Starting game countdown in room ${roomCode}`);

      // Collect participant info for DB
      const participantInfos = [];
      game.lobbyPlayers.forEach((lp, sid) => {
        const su = socketUsers.get(sid);
        participantInfos.push({
          socketId: sid,
          userId: su?.userId || null,
          guestId: su?.guestId || null,
          playerName: lp.name,
          deviceInfo: su?.deviceInfo || null,
          ipAddress: su?.ip || null
        });
      });

      game.startCountdown(async (event, data) => {
        if (event === 'countdown') {
          io.to(roomCode).emit('countdown_tick', { seconds: data });
        } else if (event === 'game_started') {
          io.to(roomCode).emit('game_started');
          io.to(roomCode).emit('state_update', game.getStatePayload());
          
          // Create DB game record
          game.dbGameId = GameDB.create(roomCode, new Date().toISOString(), game.botCount);
          game.gameStartTime = Date.now();
          game.participantInfos = participantInfos;

        } else if (event === 'combat_hit') {
          io.to(roomCode).emit('combat_event', { type: 'hit', detail: data });
        } else if (event === 'game_ended') {
          io.to(roomCode).emit('game_ended', data);
          await saveGameResult(game, data, roomCode);
        } else if (event === 'lobby_reset') {
          io.to(roomCode).emit('lobby_reset');
          io.to(roomCode).emit('state_update', game.getStatePayload());
        }
      });
    }
  });

  // Action 4: Movement inputs
  socket.on('player_input', ({ dx, dy }) => {
    const roomCode = socket.roomCode;
    if (roomCode) {
      rooms.get(roomCode)?.handlePlayerInput(socket.id, dx, dy);
    }
  });

  // Action 4.5: Shooting
  socket.on('shoot', ({ angle }) => {
    const roomCode = socket.roomCode;
    if (roomCode) {
      const game = rooms.get(roomCode);
      if (game) {
        const player = game.activePlayers.find(p => p.id === socket.id);
        const weaponName = player && player.weapon ? player.weapon.name : 'Unknown';
        if (game.handlePlayerShoot(socket.id, angle)) {
          io.to(roomCode).emit('shoot_sound_event', { playerId: socket.id, weaponType: weaponName });
        }
      }
    }
  });

  // Action 4.7: Restart game (host only, solo vs bots)
  socket.on('restart_game', () => {
    const roomCode = socket.roomCode;
    if (roomCode) {
      const game = rooms.get(roomCode);
      if (game && socket.id === game.hostId) {
        console.log(`Restarting game in room ${roomCode}`);
        
        // Stop any active countdown if it exists
        if (game.countdownTimerId) {
          clearTimeout(game.countdownTimerId);
        }

        // Collect participant info for DB
        const participantInfos = [];
        game.lobbyPlayers.forEach((lp, sid) => {
          const su = socketUsers.get(sid);
          participantInfos.push({
            socketId: sid,
            userId: su?.userId || null,
            guestId: su?.guestId || null,
            playerName: lp.name,
            deviceInfo: su?.deviceInfo || null,
            ipAddress: su?.ip || null
          });
        });

        game.startGame(async (event, data) => {
          if (event === 'countdown') {
            io.to(roomCode).emit('countdown_tick', { seconds: data });
          } else if (event === 'game_started') {
            io.to(roomCode).emit('game_started');
            io.to(roomCode).emit('state_update', game.getStatePayload());
            
            // Create DB game record
            game.dbGameId = GameDB.create(roomCode, new Date().toISOString(), game.botCount);
            game.gameStartTime = Date.now();
            game.participantInfos = participantInfos;
          } else if (event === 'combat_hit') {
            io.to(roomCode).emit('combat_event', { type: 'hit', detail: data });
          } else if (event === 'game_ended') {
            io.to(roomCode).emit('game_ended', data);
            await saveGameResult(game, data, roomCode);
          } else if (event === 'lobby_reset') {
            io.to(roomCode).emit('lobby_reset');
            io.to(roomCode).emit('state_update', game.getStatePayload());
          }
        });
      }
    }
  });

  // Action 5: Disconnect
  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;
    const userInfo = socketUsers.get(socket.id);
    socketUsers.delete(socket.id);

    if (userInfo && userInfo.userId) {
      // Check if they have ANY other active socket connection
      let hasOtherActive = false;
      for (const info of socketUsers.values()) {
        if (info.userId === userInfo.userId) {
          hasOtherActive = true;
          break;
        }
      }

      if (!hasOtherActive) {
        // Notify online friends that this user is now offline
        const friends = FriendDB.getFriends(userInfo.userId);
        friends.forEach(f => {
          for (const [sid, info] of socketUsers.entries()) {
            if (info.userId === f.id) {
              const sock = io.sockets.sockets.get(sid);
              if (sock) {
                sock.emit('friend_update', { type: 'status_change', userId: userInfo.userId, isOnline: false });
              }
            }
          }
        });
      }
    }

    if (!roomCode) {
      console.log(`Disconnected: ${socket.id} (not in room)`);
      return;
    }

    const game = rooms.get(roomCode);
    if (game) {
      console.log(`Player disconnected: ${socket.id} from room ${roomCode}`);
      game.removeLobbyPlayer(socket.id);

      const lobbyHumans = game.lobbyPlayers.size;

      if (lobbyHumans === 0) {
        console.log(`Room ${roomCode} empty. Deleting...`);
        game.cancelCountdown();
        rooms.delete(roomCode);
      } else {
        io.to(roomCode).emit('state_update', game.getStatePayload());
      }
    }
  });
});

// =============================================
// Save game result to database
// =============================================
async function saveGameResult(game, data, roomCode) {
  if (!game.dbGameId) return;

  try {
    const duration = game.gameStartTime ? Math.floor((Date.now() - game.gameStartTime) / 1000) : 0;
    const isDraw = !data.winner;
    const humanPlayers = (game.participantInfos || []).filter(p => !p.isBot);
    const playerCount = game.activePlayers?.length || 0;

    // Find winner's userId from participantInfos
    let winnerId = null;
    if (data.winner && game.participantInfos) {
      const winnerParticipant = game.participantInfos.find(p =>
        game.activePlayers?.find(ap => ap.id === p.socketId && ap.alive && !ap.isBot)
      );
      if (winnerParticipant) winnerId = winnerParticipant.userId || null;
    }

    // Finalize game record
    GameDB.finish(game.dbGameId, {
      winnerId,
      winnerName: data.winner?.name || null,
      isDraw,
      playerCount,
      durationSeconds: duration
    });

    // Add participants
    if (game.participantInfos) {
      for (const pInfo of game.participantInfos) {
        const activePlayer = game.activePlayers?.find(ap => ap.id === pInfo.socketId);
        const isWinner = data.winner && activePlayer?.name === data.winner.name;
        let result = isDraw ? 'draw' : (isWinner ? 'win' : 'loss');

        GameDB.addParticipant({
          gameId: game.dbGameId,
          userId: pInfo.userId,
          guestId: pInfo.guestId,
          playerName: pInfo.playerName,
          isBot: false,
          result,
          hpRemaining: activePlayer?.hp || 0,
          deviceInfo: pInfo.deviceInfo,
          ipAddress: pInfo.ipAddress
        });

        // Update user stats if registered
        if (pInfo.userId) {
          UserDB.updateStats(pInfo.userId, result);
          
          // Notify the player's socket of updated stats
          const playerSocket = [...io.sockets.sockets.values()]
            .find(s => socketUsers.get(s.id)?.userId === pInfo.userId);
          if (playerSocket) {
            const updatedUser = UserDB.findById(pInfo.userId);
            const { password_hash, ...safeUser } = updatedUser;
            playerSocket.emit('stats_updated', { user: safeUser, result });
          }
        }
      }
    }

    // Add bot participants (no DB user update)
    if (game.activePlayers) {
      for (const ap of game.activePlayers) {
        if (ap.isBot) {
          const isWinner = data.winner && ap.name === data.winner.name;
          const result = isDraw ? 'draw' : (isWinner ? 'win' : 'loss');
          GameDB.addParticipant({
            gameId: game.dbGameId,
            userId: null,
            guestId: null,
            playerName: ap.name,
            isBot: true,
            result,
            hpRemaining: ap.hp || 0
          });
        }
      }
    }

    console.log(`✅ Game ${game.dbGameId} saved. Duration: ${duration}s, Players: ${playerCount}, Draw: ${isDraw}`);
  } catch (err) {
    console.error('❌ Error saving game result:', err);
  }
}

// =============================================
// Authoritative Tick Loop
// =============================================
const TICK_RATE = 45;
const TICK_INTERVAL = 1000 / TICK_RATE;
let lastTickTime = Date.now();

setInterval(() => {
  const now = Date.now();
  const dt = Math.min((now - lastTickTime) / 1000, 0.1);
  lastTickTime = now;

  rooms.forEach((game, roomCode) => {
    if (game.status === 'playing') {
      game.update(dt, async (event, data) => {
        if (event === 'combat_hit') {
          io.to(roomCode).emit('combat_event', { type: 'hit', detail: data });
        } else if (event === 'shoot_sound') {
          io.to(roomCode).emit('shoot_sound_event', data);
        } else if (event === 'game_ended') {
          io.to(roomCode).emit('game_ended', data);
          await saveGameResult(game, data, roomCode);
        } else if (event === 'lobby_reset') {
          io.to(roomCode).emit('lobby_reset');
        }
      });

      io.to(roomCode).emit('state_update', game.getStatePayload());
    } else if (game.status === 'ended') {
      io.to(roomCode).emit('state_update', game.getStatePayload());
    }
  });
}, TICK_INTERVAL);

// Helper to get local network IP address
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIp();
  console.log(`===============================================`);
  console.log(`  BATTLE ROYALE SERVER RUNNING!`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`  Network URL: http://${ip}:${PORT}`);
  console.log(`  Database: battle_royale.db`);
  console.log(`  Press Ctrl+C to stop.`);
  console.log(`===============================================`);
});
