// Friends Routes
import express from 'express';
import { FriendDB, UserDB } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to emit socket events to a user's connections
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

// POST /api/friends/request — Send friend request
router.post('/request', requireAuth, (req, res) => {
  try {
    const { targetUsername } = req.body;
    if (!targetUsername) return res.status(400).json({ error: 'Target username kerak' });

    const target = UserDB.findByUsername(targetUsername);
    if (!target) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    if (target.id === req.userId) {
      return res.status(400).json({ error: 'O\'zingizga do\'stlik so\'rovi yubora olmaysiz' });
    }

    const existing = FriendDB.getRelation(req.userId, target.id);
    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(409).json({ error: 'Siz allaqachon do\'stlarsiz' });
      }
      if (existing.status === 'pending') {
        return res.status(409).json({ error: 'Do\'stlik so\'rovi allaqachon yuborilgan' });
      }
    }

    FriendDB.sendRequest(req.userId, target.id);

    // Notify target in real-time
    emitToUser(req, target.id, 'friend_update', { type: 'request_received', senderId: req.userId });
    // Notify sender as well
    emitToUser(req, req.userId, 'friend_update', { type: 'request_sent', receiverId: target.id });

    res.json({ message: `${target.display_name || target.username} ga do\'stlik so\'rovi yuborildi` });
  } catch (err) {
    console.error('Friend request error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/friends — Get friends list
router.get('/', requireAuth, (req, res) => {
  try {
    const socketUsers = req.app.get('socketUsers');
    const friends = FriendDB.getFriends(req.userId).map(f => {
      let isOnline = false;
      if (socketUsers) {
        for (const info of socketUsers.values()) {
          if (info.userId === f.id) {
            isOnline = true;
            break;
          }
        }
      }
      return { ...f, isOnline };
    });
    res.json({ friends });
  } catch (err) {
    console.error('Get friends error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/friends/requests — Pending requests received
router.get('/requests', requireAuth, (req, res) => {
  try {
    const received = FriendDB.getPendingReceived(req.userId);
    const sent = FriendDB.getPendingSent(req.userId);
    res.json({ received, sent });
  } catch (err) {
    console.error('Friend requests error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// POST /api/friends/accept
router.post('/accept', requireAuth, (req, res) => {
  try {
    const { senderId } = req.body;
    if (!senderId) return res.status(400).json({ error: 'senderId kerak' });

    FriendDB.accept(senderId, req.userId);

    // Notify both parties in real-time
    emitToUser(req, senderId, 'friend_update', { type: 'request_accepted', friendId: req.userId });
    emitToUser(req, req.userId, 'friend_update', { type: 'request_accepted', friendId: senderId });

    res.json({ message: 'Do\'stlik so\'rovi qabul qilindi!' });
  } catch (err) {
    console.error('Accept friend error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// POST /api/friends/reject
router.post('/reject', requireAuth, (req, res) => {
  try {
    const { senderId } = req.body;
    if (!senderId) return res.status(400).json({ error: 'senderId kerak' });

    FriendDB.reject(senderId, req.userId);

    // Notify both parties in real-time
    emitToUser(req, senderId, 'friend_update', { type: 'request_rejected', friendId: req.userId });
    emitToUser(req, req.userId, 'friend_update', { type: 'request_rejected', friendId: senderId });

    res.json({ message: 'Do\'stlik so\'rovi rad etildi' });
  } catch (err) {
    console.error('Reject friend error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// DELETE /api/friends/:friendId
router.delete('/:friendId', requireAuth, (req, res) => {
  try {
    const friendId = req.params.friendId;
    FriendDB.remove(req.userId, friendId);

    // Notify both parties in real-time
    emitToUser(req, friendId, 'friend_update', { type: 'friend_removed', friendId: req.userId });
    emitToUser(req, req.userId, 'friend_update', { type: 'friend_removed', friendId: friendId });

    res.json({ message: 'Do\'stlikdan chiqarildi' });
  } catch (err) {
    console.error('Remove friend error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/friends/search?q=username
router.get('/search', requireAuth, (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ users: [] });

    const users = UserDB.searchByUsername(q)
      .filter(u => u.id !== req.userId)
      .map(u => {
        const rel = FriendDB.getRelation(req.userId, u.id);
        return { ...u, relation: rel ? rel.status : 'none', relationSenderId: rel?.sender_id };
      });

    res.json({ users });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

export default router;
