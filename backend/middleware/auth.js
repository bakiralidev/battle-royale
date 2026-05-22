// JWT Authentication Middleware
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'battle_royale_super_secret_key_2024';
export const JWT_EXPIRES = '30d';

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Express middleware — attaches req.user if valid token
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token kerak' });
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token noto\'g\'ri yoki muddati o\'tgan' });
  }

  req.userId = payload.userId;
  next();
}

// Optional auth — attaches req.userId if present, doesn't block
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (payload) req.userId = payload.userId;
  }
  next();
}
