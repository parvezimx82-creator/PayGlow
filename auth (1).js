import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { asyncHandler, HttpError } from '../lib/errors.js';

const router = Router();
const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,32}$/),
  email: z.string().trim().email().max(190),
  whatsapp: z.string().trim().min(7).max(32),
  password: z.string().min(10).max(128),
  referralCode: z.string().trim().max(32).optional().default('')
});
const loginSchema = z.object({ login: z.string().trim().min(3).max(190), password: z.string().min(1).max(128) });

router.post('/register', asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let referrerId = null;
    if (data.referralCode) {
      const [ref] = await conn.execute('SELECT id FROM users WHERE referral_code = ? OR username = ?', [data.referralCode, data.referralCode]);
      if (ref[0]) referrerId = ref[0].id;
    }
    const hash = await bcrypt.hash(data.password, 12);
    const [result] = await conn.execute(
      'INSERT INTO users (full_name, username, email, whatsapp, password_hash, referral_code, referred_by) VALUES (?,?,?,?,?,?,?)',
      [data.fullName, data.username, data.email.toLowerCase(), data.whatsapp, hash, data.username, referrerId]
    );
    await conn.execute('INSERT INTO wallet_accounts (user_id) VALUES (?)', [result.insertId]);
    await conn.commit();
    res.status(201).json({ message: 'Registration successful. Please log in.' });
  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Username or email already exists');
    throw e;
  } finally { conn.release(); }
}));

router.post('/login', asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const [rows] = await pool.execute(
    'SELECT id, username, password_hash, role, status FROM users WHERE username = ? OR email = ? LIMIT 1',
    [data.login, data.login.toLowerCase()]
  );
  const user = rows[0];
  if (!user || user.status !== 'active' || !(await bcrypt.compare(data.password, user.password_hash))) {
    throw new HttpError(401, 'Invalid credentials');
  }
  const token = jwt.sign({ sub: String(user.id), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '2h' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
}));
export default router;
