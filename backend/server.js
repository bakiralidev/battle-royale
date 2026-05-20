// Real-Time Battle Royale Backend Server (Room-based)
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameStateManager, GAME_CONFIG } from './game-state.js';

// Absolute path resolution for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '../frontend');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Serve frontend static files
app.use(express.static(frontendPath));

// Port configuration
const PORT = process.env.PORT || 3000;

// Active rooms map: roomCode -> GameStateManager
const rooms = new Map();

// Helper to generate a unique 4-digit room code
function generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
  } while (rooms.has(code));
  return code;
}

// Socket.IO event handler
io.on('connection', (socket) => {
  console.log(`Connection established: ${socket.id}`);

  // Send initial configs
  socket.emit('init_config', {
    WIDTH: GAME_CONFIG.WIDTH,
    HEIGHT: GAME_CONFIG.HEIGHT,
    ZONE_DURATION: GAME_CONFIG.ZONE_DURATION,
    ZONE_DAMAGE_RATE: GAME_CONFIG.ZONE_DAMAGE_RATE,
    ATTACK_COOLDOWN: GAME_CONFIG.ATTACK_COOLDOWN
  });

  // Action 1: Create a room
  socket.on('create_room', ({ name, color, useBots, botCount }) => {
    const roomCode = generateRoomCode();
    
    // Create new GameStateManager for this room
    const game = new GameStateManager(roomCode, socket.id, useBots, botCount);
    game.addLobbyPlayer(socket.id, name, color);
    
    rooms.set(roomCode, game);
    socket.roomCode = roomCode;
    socket.join(roomCode);

    console.log(`Room created: ${roomCode} by host: ${name} (${socket.id}). Bots: ${useBots} (${botCount})`);

    // Confirm creation back to client
    socket.emit('room_joined', {
      roomCode,
      isHost: true,
      hostId: socket.id
    });

    // Broadcast update to room
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

    // Join
    game.addLobbyPlayer(socket.id, name, color);
    socket.roomCode = code;
    socket.join(code);

    console.log(`Player ${name} (${socket.id}) joined room: ${code}`);

    socket.emit('room_joined', {
      roomCode: code,
      isHost: false,
      hostId: game.hostId
    });

    // Broadcast state update to everyone in the room
    io.to(code).emit('state_update', game.getStatePayload());
  });

  // Action 3: Start match (triggered by host)
  socket.on('start_game_request', () => {
    const roomCode = socket.roomCode;
    if (!roomCode) return;

    const game = rooms.get(roomCode);
    if (!game) return;

    // Check authority: only host can start
    if (socket.id !== game.hostId) {
      socket.emit('room_error', "Faqat xona egasi o'yinni boshlay oladi!");
      return;
    }

    if (game.status === 'lobby') {
      console.log(`Starting game countdown in room ${roomCode}`);
      game.startCountdown((event, data) => {
        if (event === 'countdown') {
          io.to(roomCode).emit('countdown_tick', { seconds: data });
        } else if (event === 'game_started') {
          io.to(roomCode).emit('game_started');
          io.to(roomCode).emit('state_update', game.getStatePayload());
        } else if (event === 'combat_hit') {
          io.to(roomCode).emit('combat_event', { type: 'hit', detail: data });
        } else if (event === 'game_ended') {
          io.to(roomCode).emit('game_ended', data);
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

  // Action 5: Disconnect
  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;
    if (!roomCode) {
      console.log(`Connection disconnected: ${socket.id} (not in room)`);
      return;
    }

    const game = rooms.get(roomCode);
    if (game) {
      console.log(`Player disconnected: ${socket.id} from room ${roomCode}`);
      game.removeLobbyPlayer(socket.id);

      // Check if any human players are left in the lobby or active game
      const lobbyHumans = game.lobbyPlayers.size;

      if (lobbyHumans === 0) {
        console.log(`Room ${roomCode} has 0 human players left. Deleting room...`);
        game.cancelCountdown();
        rooms.delete(roomCode);
      } else {
        // Room still has players, broadcast new state (including host change if host left)
        if (game.status === 'countdown') {
          // If countdown is running and lobby changes, keep going or cancel if it was host?
          // Since host transferred, new host takes over
        }
        io.to(roomCode).emit('state_update', game.getStatePayload());
      }
    }
  });
});

// Authoritative Tick Loop
const TICK_RATE = 45; // 45hz update ticks
const TICK_INTERVAL = 1000 / TICK_RATE;
let lastTickTime = Date.now();

setInterval(() => {
  const now = Date.now();
  const dt = Math.min((now - lastTickTime) / 1000, 0.1);
  lastTickTime = now;

  rooms.forEach((game, roomCode) => {
    if (game.status === 'playing') {
      game.update(dt, (event, data) => {
        if (event === 'combat_hit') {
          io.to(roomCode).emit('combat_event', { type: 'hit', detail: data });
        } else if (event === 'game_ended') {
          io.to(roomCode).emit('game_ended', data);
        } else if (event === 'lobby_reset') {
          io.to(roomCode).emit('lobby_reset');
        }
      });
      
      io.to(roomCode).emit('state_update', game.getStatePayload());
    } else if (game.status === 'ended') {
      // Keep sending state (timer tick updates) during ended transition screen
      io.to(roomCode).emit('state_update', game.getStatePayload());
    }
  });
}, TICK_INTERVAL);

// Start server
httpServer.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  BATTLE ROYALE ROOM SERVER RUNNING SUCCESSFULLY!`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`  Press Ctrl+C to stop.`);
  console.log(`===============================================`);
});
