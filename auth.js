import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { HttpError } from '../lib/errors.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Authentication required');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.execute('SELECT id, username, role, status FROM users WHERE id = ?', [payload.sub]);
    const user = rows[0];
    if (!user || user.status !== 'active') throw new HttpError(401, 'Account unavailable');
    req.user = user;
    next();
  } catch (err) { next(err instanceof HttpError ? err : new HttpError(401, 'Invalid or expired token')); }
}
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return next(new HttpError(403, 'Admin access required'));
  next();
}
