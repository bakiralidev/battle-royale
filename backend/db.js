// Database Layer — SQLite with better-sqlite3
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'battle_royale.db');
export const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// =============================================
// Create Tables
// =============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    color TEXT DEFAULT '#4da6ff',
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    hp_base INTEGER DEFAULT 100,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    last_seen TEXT
  );

  CREATE TABLE IF NOT EXISTS friends (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(sender_id, receiver_id)
  );

  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    room_code TEXT NOT NULL,
    player_count INTEGER DEFAULT 0,
    bot_count INTEGER DEFAULT 0,
    winner_id TEXT,
    winner_name TEXT,
    is_draw INTEGER DEFAULT 0,
    started_at TEXT,
    ended_at TEXT DEFAULT (datetime('now')),
    duration_seconds INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS game_participants (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    user_id TEXT,
    guest_id TEXT,
    player_name TEXT NOT NULL,
    is_bot INTEGER DEFAULT 0,
    result TEXT DEFAULT 'loss',
    hp_remaining REAL DEFAULT 0,
    kills INTEGER DEFAULT 0,
    device_info TEXT,
    ip_address TEXT,
    joined_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS login_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    logged_in_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Migration to add avatar and custom_emojis columns if not already present
try {
  db.exec("ALTER TABLE users ADD COLUMN avatar TEXT;");
} catch (e) {
  // Column already exists
}
try {
  db.exec("ALTER TABLE users ADD COLUMN custom_emojis TEXT;");
} catch (e) {
  // Column already exists
}
try {
  db.exec("ALTER TABLE users ADD COLUMN custom_smiley TEXT;");
} catch (e) {
  // Column already exists
}
try {
  db.exec("ALTER TABLE users ADD COLUMN saved_smileys TEXT;");
} catch (e) {
  // Column already exists
}

// =============================================
// Users
// =============================================
export const UserDB = {
  create(username, passwordHash, displayName, color = '#4da6ff') {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO users (id, username, password_hash, display_name, color)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, username, passwordHash, displayName || username, color);
    return id;
  },

  findByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  updateLastSeen(id) {
    db.prepare("UPDATE users SET last_seen = datetime('now') WHERE id = ?").run(id);
  },

  updateStats(id, result) {
    // result: 'win' | 'loss' | 'draw'
    let xpGain = 5; // base for playing
    let winInc = 0, lossInc = 0, drawInc = 0;

    if (result === 'win') { xpGain += 50; winInc = 1; }
    else if (result === 'draw') { xpGain += 20; drawInc = 1; }
    else { xpGain += 10; lossInc = 1; }

    db.prepare(`
      UPDATE users SET
        games_played = games_played + 1,
        wins = wins + ?,
        losses = losses + ?,
        draws = draws + ?,
        xp = xp + ?,
        level = MAX(1, MIN(10, 1 + (xp + ?) / 200)),
        last_seen = datetime('now')
      WHERE id = ?
    `).run(winInc, lossInc, drawInc, xpGain, xpGain, id);

    return this.findById(id);
  },

  updateProfile(id, fields) {
    const allowed = ['display_name', 'color', 'avatar', 'custom_emojis', 'custom_smiley', 'saved_smileys'];
    const sets = [];
    const vals = [];
    for (const [k, v] of Object.entries(fields)) {
      if (allowed.includes(k) && v !== undefined) { sets.push(`${k} = ?`); vals.push(v); }
    }
    if (!sets.length) return;
    vals.push(id);
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  },

  isNicknameTaken(nickname, excludeUserId) {
    let stmt;
    if (excludeUserId) {
      stmt = db.prepare(`
        SELECT id FROM users
        WHERE (username = ? COLLATE NOCASE OR display_name = ? COLLATE NOCASE) AND id != ?
      `);
      return !!stmt.get(nickname, nickname, excludeUserId);
    } else {
      stmt = db.prepare(`
        SELECT id FROM users
        WHERE username = ? COLLATE NOCASE OR display_name = ? COLLATE NOCASE
      `);
      return !!stmt.get(nickname, nickname);
    }
  },

  getLeaderboard(limit = 20) {
    return db.prepare(`
      SELECT id, username, display_name, color, level, xp, wins, losses, draws, games_played, avatar, custom_emojis
      FROM users
      ORDER BY wins DESC, xp DESC
      LIMIT ?
    `).all(limit);
  },

  searchByUsername(query, limit = 10) {
    return db.prepare(`
      SELECT id, username, display_name, color, level, wins, games_played, avatar
      FROM users
      WHERE username LIKE ? COLLATE NOCASE
      LIMIT ?
    `).all(`%${query}%`, limit);
  }
};

// =============================================
// Friends
// =============================================
export const FriendDB = {
  sendRequest(senderId, receiverId) {
    const id = uuidv4();
    db.prepare(`
      INSERT OR IGNORE INTO friends (id, sender_id, receiver_id, status)
      VALUES (?, ?, ?, 'pending')
    `).run(id, senderId, receiverId);
  },

  accept(senderId, receiverId) {
    db.prepare(`
      UPDATE friends SET status = 'accepted'
      WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
    `).run(senderId, receiverId);
  },

  reject(senderId, receiverId) {
    db.prepare(`
      UPDATE friends SET status = 'rejected'
      WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
    `).run(senderId, receiverId);
  },

  remove(userId, friendId) {
    db.prepare(`
      DELETE FROM friends
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    `).run(userId, friendId, friendId, userId);
  },

  getFriends(userId) {
    return db.prepare(`
      SELECT u.id, u.username, u.display_name, u.color, u.level, u.wins, u.last_seen, u.avatar,
             f.created_at as friends_since
      FROM friends f
      JOIN users u ON (
        CASE WHEN f.sender_id = ? THEN f.receiver_id ELSE f.sender_id END = u.id
      )
      WHERE (f.sender_id = ? OR f.receiver_id = ?) AND f.status = 'accepted'
    `).all(userId, userId, userId);
  },

  getPendingReceived(userId) {
    return db.prepare(`
      SELECT f.id, f.sender_id, f.created_at,
             u.username, u.display_name, u.color, u.level, u.avatar
      FROM friends f
      JOIN users u ON f.sender_id = u.id
      WHERE f.receiver_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `).all(userId);
  },

  getPendingSent(userId) {
    return db.prepare(`
      SELECT f.id, f.receiver_id, f.created_at,
             u.username, u.display_name, u.color, u.level, u.avatar
      FROM friends f
      JOIN users u ON f.receiver_id = u.id
      WHERE f.sender_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `).all(userId);
  },

  getRelation(userId, otherUserId) {
    return db.prepare(`
      SELECT * FROM friends
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    `).get(userId, otherUserId, otherUserId, userId);
  }
};

// =============================================
// Games
// =============================================
export const GameDB = {
  create(roomCode, startedAt, botCount = 0) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO games (id, room_code, bot_count, started_at)
      VALUES (?, ?, ?, ?)
    `).run(id, roomCode, botCount, startedAt || new Date().toISOString());
    return id;
  },

  finish(gameId, { winnerId, winnerName, isDraw, playerCount, durationSeconds }) {
    db.prepare(`
      UPDATE games SET
        winner_id = ?,
        winner_name = ?,
        is_draw = ?,
        player_count = ?,
        ended_at = datetime('now'),
        duration_seconds = ?
      WHERE id = ?
    `).run(winnerId || null, winnerName || null, isDraw ? 1 : 0, playerCount, durationSeconds || 0, gameId);
  },

  addParticipant({ gameId, userId, guestId, playerName, isBot, result, hpRemaining, deviceInfo, ipAddress }) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO game_participants
        (id, game_id, user_id, guest_id, player_name, is_bot, result, hp_remaining, device_info, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, gameId, userId || null, guestId || null, playerName, isBot ? 1 : 0, result, hpRemaining || 0, deviceInfo || null, ipAddress || null);
  },

  getRecentGames(userId, limit = 10) {
    return db.prepare(`
      SELECT g.id, g.room_code, g.player_count, g.bot_count, g.winner_name, g.is_draw,
             g.started_at, g.ended_at, g.duration_seconds,
             gp.result, gp.hp_remaining, gp.kills
      FROM game_participants gp
      JOIN games g ON gp.game_id = g.id
      WHERE gp.user_id = ?
      ORDER BY g.ended_at DESC
      LIMIT ?
    `).all(userId, limit);
  }
};

// =============================================
// Login Sessions
// =============================================
export const SessionDB = {
  create(userId, deviceInfo, ipAddress) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO login_sessions (id, user_id, device_info, ip_address)
      VALUES (?, ?, ?, ?)
    `).run(id, userId, deviceInfo || null, ipAddress || null);
    return id;
  },

  getByUser(userId, limit = 10) {
    return db.prepare(`
      SELECT id, device_info, ip_address, logged_in_at
      FROM login_sessions
      WHERE user_id = ?
      ORDER BY logged_in_at DESC
      LIMIT ?
    `).all(userId, limit);
  }
};

console.log(`✅ SQLite DB initialized: ${DB_PATH}`);
