import { verifyToken } from '../utils/jwt.js';
import { dbHelpers } from '../config/instantdb.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Verify user still exists
  const user = await dbHelpers.getUserById(decoded.userId);
  if (!user) {
    return res.status(403).json({ error: 'User not found' });
  }

  req.user = {
    userId: decoded.userId,
    email: decoded.email,
    username: decoded.username
  };

  next();
}

export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();
  const decoded = verifyToken(token);
  if (!decoded) return next();
  const user = await dbHelpers.getUserById(decoded.userId);
  if (!user) return next();
  req.user = { userId: decoded.userId, email: decoded.email, username: decoded.username };
  next();
}
