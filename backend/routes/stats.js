// Stats Routes — Leaderboard, Game History, Sessions
import express from 'express';
import { UserDB, GameDB, SessionDB } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/stats/leaderboard
router.get('/leaderboard', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const leaders = UserDB.getLeaderboard(Math.min(limit, 50));
    res.json({ leaders });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/stats/history — current user's game history
router.get('/history', requireAuth, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const games = GameDB.getRecentGames(req.userId, limit);
    res.json({ games });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/stats/sessions — login sessions for current user
router.get('/sessions', requireAuth, (req, res) => {
  try {
    const sessions = SessionDB.getByUser(req.userId, 15);
    res.json({ sessions });
  } catch (err) {
    console.error('Sessions error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/stats/profile/:userId — Public profile stats
router.get('/profile/:userId', (req, res) => {
  try {
    const user = UserDB.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Topilmadi' });
    const { password_hash, ...safe } = user;
    res.json({ user: safe });
  } catch (err) {
    console.error('Profile stats error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

export default router;
