// Auth Routes — Register, Login, Me
import express from 'express';
import bcrypt from 'bcrypt';
import { UserDB, SessionDB, FriendDB } from '../db.js';
import { generateToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();
const SALT_ROUNDS = 10;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName, color } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username va parol majburiy' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username 3-20 ta belgidan iborat bo\'lishi kerak' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username faqat harf, raqam va _ dan iborat bo\'lishi mumkin' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    }

    const existing = UserDB.findByUsername(username);
    if (existing) {
      return res.status(409).json({ error: 'Bu username band, boshqasini tanlang' });
    }

    const nameToCheck = displayName || username;
    if (UserDB.isNicknameTaken(nameToCheck)) {
      return res.status(409).json({ error: 'Bu taxallus (display name) allaqachon band' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = UserDB.create(username, passwordHash, displayName, color);

    // Log session
    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection?.remoteAddress;
    SessionDB.create(userId, deviceInfo, ipAddress);

    const token = generateToken(userId);
    const user = UserDB.findById(userId);

    res.status(201).json({
      token,
      user: sanitizeUser(user),
      message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz!'
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username va parol majburiy' });
    }

    const user = UserDB.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Username yoki parol noto\'g\'ri' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Username yoki parol noto\'g\'ri' });
    }

    // Log session
    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection?.remoteAddress;
    SessionDB.create(user.id, deviceInfo, ipAddress);
    UserDB.updateLastSeen(user.id);

    const token = generateToken(user.id);

    res.json({
      token,
      user: sanitizeUser(user),
      message: 'Muvaffaqiyatli kirdingiz!'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/auth/me — Returns current user profile
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = UserDB.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    UserDB.updateLastSeen(user.id);
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// PUT /api/auth/profile — Update display name, color, avatar, and custom emojis
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { displayName, color, avatar, customEmojis, customSmiley, savedSmileys } = req.body;

    if (displayName) {
      if (displayName.length < 3 || displayName.length > 20) {
        return res.status(400).json({ error: 'Taxallus 3-20 ta belgidan iborat bo\'lishi kerak' });
      }
      if (UserDB.isNicknameTaken(displayName, req.userId)) {
        return res.status(409).json({ error: 'Bunday taxallusli foydalanuvchi allaqachon mavjud' });
      }
    }

    UserDB.updateProfile(req.userId, {
      display_name: displayName,
      color,
      avatar,
      custom_emojis: customEmojis ? JSON.stringify(customEmojis) : undefined,
      custom_smiley: customSmiley,
      saved_smileys: savedSmileys ? JSON.stringify(savedSmileys) : undefined
    });

    const user = UserDB.findById(req.userId);

    // Update socket user details and lobby state dynamically
    const socketUsers = req.app.get('socketUsers');
    const io = req.app.get('io');
    const rooms = req.app.get('rooms');
    if (socketUsers && io) {
      for (const [sid, info] of socketUsers.entries()) {
        if (info.userId === req.userId) {
          if (displayName) info.displayName = displayName;
          if (color) info.color = color;
          if (avatar !== undefined) info.avatar = avatar;
          if (customEmojis !== undefined) info.customEmojis = customEmojis;
          if (customSmiley !== undefined) info.customSmiley = customSmiley;

          const sock = io.sockets.sockets.get(sid);
          if (sock && sock.roomCode && rooms) {
            const game = rooms.get(sock.roomCode);
            if (game) {
              const lp = game.lobbyPlayers.get(sid);
              if (lp) {
                if (displayName) lp.name = displayName;
                if (color) lp.color = color;
                if (avatar !== undefined) lp.avatar = avatar;
                if (customEmojis !== undefined) lp.customEmojis = customEmojis;
                if (customSmiley !== undefined) lp.customSmiley = customSmiley;
              }
              // Broadcast updated room state to room participants
              io.to(sock.roomCode).emit('state_update', game.getStatePayload());
            }
          }
        }
      }
    }

    // Notify friends of profile/avatar/name changes
    const friends = FriendDB.getFriends(req.userId);
    for (const f of friends) {
      emitToUser(req, f.id, 'friend_update', { type: 'profile_change', userId: req.userId });
    }

    res.json({ user: sanitizeUser(user), message: 'Profil yangilandi' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  safe.level = computeLevel(user.xp);
  return safe;
}

function computeLevel(xp) {
  if (xp >= 2000) return 6;
  if (xp >= 1000) return 5;
  if (xp >= 600) return 4;
  if (xp >= 300) return 3;
  if (xp >= 100) return 2;
  return 1;
}

function emitToUser(req, userId, event, data) {
  const io = req.app.get('io');
  const socketUsers = req.app.get('socketUsers');
  if (io && socketUsers) {
    for (const [sid, info] of socketUsers.entries()) {
      if (info.userId === userId) {
        const sock = io.sockets.sockets.get(sid);
        if (sock) {
          sock.emit(event, data);
        }
      }
    }
  }
}

export default router;
