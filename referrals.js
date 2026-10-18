import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';

const router = Router();
const levelOf = n => (n >= 100 ? 3 : n >= 50 ? 2 : 1);

// আমার রেফারেল তথ্য (লিংক + কাউন্ট + লেভেল + প্রোগ্রেস)
router.get('/mine', requireAuth, asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const [[u]] = await pool.execute('SELECT username, referral_code FROM users WHERE id=?', [uid]);
  const [[cnt]] = await pool.execute('SELECT COUNT(*) c FROM users WHERE referred_by=?', [uid]);
  const [[valid]] = await pool.execute(`SELECT COUNT(DISTINCT r.id) c FROM users r JOIN task_submissions s ON s.user_id=r.id AND s.status IN ('approved','completed') WHERE r.referred_by=?`, [uid]);
  const [[w]] = await pool.execute('SELECT referral_earnings FROM wallet_accounts WHERE user_id=?', [uid]);
  const [[mine]] = await pool.execute(`SELECT COUNT(*) c FROM task_submissions WHERE user_id=? AND status IN ('approved','completed')`, [uid]);
  const total = cnt.c || 0, lvl = levelOf(total);
  const nextAt = lvl === 1 ? 50 : lvl === 2 ? 100 : null;
  res.json({
    link: `https://payglow.com/ref/${u?.referral_code || u?.username || uid}`,
    total_refers: total, valid_refers: valid.c || 0, total_earned: w?.referral_earnings || 0,
    my_tasks: mine.c || 0, level: lvl, next_at: nextAt,
    progress: nextAt ? Math.min(100, Math.round(total / nextAt * 100)) : 100,
  });
}));

// রেফারেল লিডারবোর্ড (টপ ১০০ — রিয়েল ডেটা, সার্চ + পেজিনেশন)
router.get('/leaderboard', requireAuth, asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const size = 10, off = (page - 1) * size;
  const like = `%${q}%`;
  const where = q ? 'WHERE u.username LIKE ?' : '';
  const args = q ? [like, like] : [];
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) c FROM (SELECT u.id FROM users u LEFT JOIN users r ON r.referred_by=u.id ${where} GROUP BY u.id HAVING COUNT(r.id)>0) x`, args);
  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.full_name, COUNT(r.id) AS total_refers,
       COALESCE(w.referral_earnings,0) AS total_earned,
       (SELECT COUNT(*) FROM task_submissions s WHERE s.user_id=u.id AND s.status IN ('approved','completed')) AS tasks_completed,
       (SELECT COUNT(DISTINCT r2.id) FROM users r2 JOIN task_submissions s2 ON s2.user_id=r2.id AND s2.status IN ('approved','completed') WHERE r2.referred_by=u.id) AS valid_refers
     FROM users u
     LEFT JOIN users r ON r.referred_by = u.id
     LEFT JOIN wallet_accounts w ON w.user_id = u.id
     ${where}
     GROUP BY u.id, u.username, u.full_name, w.referral_earnings
     HAVING total_refers > 0
     ORDER BY total_refers DESC, total_earned DESC
     LIMIT ${size} OFFSET ${off}`, args);
  res.json({ rows: rows.map((r, i) => ({ ...r, rank: off + i + 1, level: levelOf(r.total_refers) })), total, pages: Math.max(1, Math.ceil(total / size)) });
}));

export default router;
