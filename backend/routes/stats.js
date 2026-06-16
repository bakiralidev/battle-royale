// Stats Routes — Leaderboard, Game History, Sessions
import express from 'express';
import { db, UserDB, GameDB, SessionDB, StatsDB } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/stats/leaderboard
router.get('/leaderboard', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const sort = req.query.sort || 'wins';
    
    let leaders;
    if (sort === 'kills') {
      leaders = db.prepare(`
        SELECT u.id, u.username, u.display_name, u.color, u.level, u.xp, u.avatar, u.custom_emojis,
               s.total_wins as wins, s.total_kills as kills, s.total_games as games_played,
               ROUND(s.total_wins * 100.0 / NULLIF(s.total_games, 0), 1) as win_rate
        FROM users u
        LEFT JOIN player_stats s ON u.id = s.player_id
        ORDER BY COALESCE(s.total_kills, 0) DESC, u.xp DESC
        LIMIT ?
      `).all(limit);
    } else if (sort === 'ratio') {
      leaders = db.prepare(`
        SELECT u.id, u.username, u.display_name, u.color, u.level, u.xp, u.avatar, u.custom_emojis,
               s.total_wins as wins, s.total_kills as kills, s.total_games as games_played,
               ROUND(s.total_wins * 100.0 / NULLIF(s.total_games, 0), 1) as win_rate
        FROM users u
        LEFT JOIN player_stats s ON u.id = s.player_id
        ORDER BY COALESCE(s.total_wins * 1.0 / NULLIF(s.total_games, 0), 0) DESC, s.total_wins DESC, u.xp DESC
        LIMIT ?
      `).all(limit);
    } else {
      // Default: wins
      leaders = db.prepare(`
        SELECT u.id, u.username, u.display_name, u.color, u.level, u.xp, u.avatar, u.custom_emojis,
               s.total_wins as wins, s.total_kills as kills, s.total_games as games_played,
               ROUND(s.total_wins * 100.0 / NULLIF(s.total_games, 0), 1) as win_rate
        FROM users u
        LEFT JOIN player_stats s ON u.id = s.player_id
        ORDER BY COALESCE(s.total_wins, 0) DESC, u.xp DESC
        LIMIT ?
      `).all(limit);
    }
    
    // Ensure wins, kills, games_played are present even if player_stats row doesn't exist yet
    leaders = leaders.map(u => ({
      ...u,
      wins: u.wins || 0,
      kills: u.kills || 0,
      games_played: u.games_played || 0,
      win_rate: u.win_rate || 0
    }));

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

// GET /api/stats/player-stats — get player_stats for current authenticated user
router.get('/player-stats', requireAuth, (req, res) => {
  try {
    const stats = StatsDB.getOrCreate(req.userId);
    res.json({ stats });
  } catch (err) {
    console.error('Player stats error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/stats/player-stats/:userId — get player_stats for a specific user
router.get('/player-stats/:userId', (req, res) => {
  try {
    const stats = StatsDB.getOrCreate(req.params.userId);
    res.json({ stats });
  } catch (err) {
    console.error('Player stats error for user:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

export default router;
