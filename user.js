import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';

const router = Router();
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT id, full_name, username, email, whatsapp, role, referral_code, created_at FROM users WHERE id = ?', [req.user.id]);
  res.json(rows[0]);
}));
router.get('/wallet', requireAuth, asyncHandler(async (req, res) => {
  const [rows] = await pool.execute('SELECT main_balance, referral_earnings, pending_cashout FROM wallet_accounts WHERE user_id = ?', [req.user.id]);
  res.json(rows[0] || { main_balance: 0, referral_earnings: 0, pending_cashout: 0 });
}));

// ইউজার ড্যাশবোর্ড পরিসংখ্যান (spec §5)
router.get('/stats', async (req, res, next) => {
  try {
    const uid = req.user.id;
    const [sub] = await pool.query(`SELECT SUM(status='pending') pending, SUM(status='processing') processing,
      SUM(status IN ('approved','completed')) approved, SUM(status='rejected') rejected, COUNT(*) total
      FROM task_submissions WHERE user_id=?`, [uid]);
    const [[wallet]] = await pool.query('SELECT main_balance, referral_earnings, pending_cashout FROM wallet_accounts WHERE user_id=?', [uid]);
    const [[dep]] = await pool.query("SELECT COALESCE(SUM(amount),0) s FROM deposit_requests WHERE user_id=? AND status='completed'", [uid]);
    const [[wd]] = await pool.query("SELECT COALESCE(SUM(amount),0) s FROM withdrawals WHERE user_id=? AND status='completed'", [uid]);
    const [[tasks]] = await pool.query("SELECT COUNT(*) c FROM tasks WHERE status='active'");
    const [depHist] = await pool.query('SELECT amount, method, status, created_at FROM deposit_requests WHERE user_id=? ORDER BY id DESC LIMIT 20', [uid]);
    const [wdHist] = await pool.query('SELECT amount, method, status, created_at FROM withdrawals WHERE user_id=? ORDER BY id DESC LIMIT 20', [uid]);
    res.json({ tasksAvailable: tasks.c, submissions: sub[0], wallet, deposited: dep.s, withdrawn: wd.s, depositHistory: depHist, withdrawalHistory: wdHist });
  } catch (e) { next(e); }
});


// আমার সাবমিশন তালিকা (task ডিটেইল পেজের ইতিহাসের জন্য)
router.get('/submissions', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, task_id, status, created_at, review_note FROM task_submissions WHERE user_id=? ORDER BY id DESC LIMIT 30', [req.user.id]);
    res.json(rows);
  } catch (e) { next(e); }
});

export default router;
