import { Router } from 'express';
import { pool } from '../db/pool.js';
import { adminOnly } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';

const router = Router();
router.use(adminOnly);

const THEME_KEYS = {
  primaryColor: 'theme_primary_color',
  secondaryColor: 'theme_secondary_color',
  gradientStart: 'theme_gradient_start',
  gradientEnd: 'theme_gradient_end',
  gradientDirection: 'theme_gradient_direction',
};
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// ---------- Theme (admin) ----------
router.get('/theme', async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT `key`,`value` FROM settings WHERE `key` LIKE 'theme_%'");
    const t = {}; for (const r of rows) t[r.key] = r.value;
    res.json({ primaryColor: t.theme_primary_color, secondaryColor: t.theme_secondary_color,
      gradientStart: t.theme_gradient_start, gradientEnd: t.theme_gradient_end, gradientDirection: t.theme_gradient_direction });
  } catch (e) { next(e); }
});

router.put('/theme', async (req, res, next) => {
  try {
    const body = req.body || {};
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const [field, key] of Object.entries(THEME_KEYS)) {
        let val = (body[field] ?? '').toString().trim();
        if (!val) continue;
        if (field === 'gradientDirection') {
          const d = parseInt(val, 10);
          if (!(d >= 0 && d <= 360)) { await conn.rollback(); return res.status(400).json({ message: 'Gradient direction must be 0-360' }); }
          val = String(d);
        } else if (!HEX_RE.test(val)) { await conn.rollback(); return res.status(400).json({ message: `Invalid color for ${field}` }); }
        await conn.query('INSERT INTO settings (`key`,`value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)', [key, val]);
      }
      await conn.commit();
    } finally { conn.release(); }
    await logAudit({ adminId: req.user.id, action: 'theme_update', entityType: 'settings', entityId: 0, meta: body });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---------- Categories CRUD ----------
router.get('/categories', async (req, res, next) => {
  try { const [rows] = await pool.query('SELECT * FROM task_categories ORDER BY sort_order, id'); res.json(rows); } catch (e) { next(e); }
});
router.post('/categories', async (req, res, next) => {
  try {
    const { name, name_en = '', icon = '📋', sort_order = 0 } = req.body || {};
    if (!name) return res.status(400).json({ message: 'name is required' });
    const [r] = await pool.query('INSERT INTO task_categories (name,name_en,icon,sort_order) VALUES (?,?,?,?)', [name, name_en, icon, sort_order]);
    await logAudit({ adminId: req.user.id, action: 'category_create', entityType: 'category', entityId: r.insertId });
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
});
router.patch('/categories/:id', async (req, res, next) => {
  try {
    const { name, name_en, icon, sort_order, status } = req.body || {};
    await pool.query('UPDATE task_categories SET name=COALESCE(?,name), name_en=COALESCE(?,name_en), icon=COALESCE(?,icon), sort_order=COALESCE(?,sort_order), status=COALESCE(?,status) WHERE id=?',
      [name, name_en, icon, sort_order, status, req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
router.delete('/categories/:id', async (req, res, next) => {
  try {
    await pool.query('UPDATE tasks SET category_id=NULL WHERE category_id=?', [req.params.id]);
    await pool.query('DELETE FROM task_categories WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---------- Task create (extended fields) ----------
router.post('/tasks', async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.title_en || !b.category_id || !(b.reward_amount > 0)) return res.status(400).json({ message: 'title_en, category_id, reward_amount required' });
    const [r] = await pool.query(
      `INSERT INTO tasks (category_id,title_en,title_bn,reward_amount,instructions,required_link,total_limit,per_user_limit,starts_at,ends_at,sort_order,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,COALESCE(?,'active'))`,
      [b.category_id, b.title_en, b.title_bn || '', b.reward_amount, b.instructions || '', b.required_link || '',
       b.total_limit || 0, b.per_user_limit || 0, b.starts_at || null, b.ends_at || null, b.sort_order || 0, b.status || 'active']);
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
});

// ---------- Submission status transitions ----------
router.patch('/submissions/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!['processing'].includes(status)) return res.status(400).json({ message: 'Only pending->processing allowed here' });
    const [r] = await pool.query("UPDATE task_submissions SET status='processing' WHERE id=? AND status='pending'", [req.params.id]);
    if (!r.affectedRows) return res.status(409).json({ message: 'Already processed' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---------- Withdrawal review v2 (processing/completed/rejected + refund) ----------
router.post('/withdrawals/:id/review', async (req, res, next) => {
  try {
    const { decision, reason = '', tx_ref = '' } = req.body || {};
    if (!['processing', 'completed', 'rejected'].includes(decision)) return res.status(400).json({ message: 'bad decision' });
    if (decision === 'rejected' && !reason.trim()) return res.status(400).json({ message: 'Rejection reason required' });
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query('SELECT * FROM withdrawals WHERE id=? FOR UPDATE', [req.params.id]);
      const w = rows[0];
      if (!w) { await conn.rollback(); return res.status(404).json({ message: 'Not found' }); }
      if (w.status !== 'pending') { await conn.rollback(); return res.status(409).json({ message: 'Already processed (' + w.status + ')' }); }
      if (decision === 'processing') {
        await conn.query("UPDATE withdrawals SET status='processing', tx_ref=? WHERE id=?", [tx_ref, w.id]);
      } else if (decision === 'completed') {
        await conn.query("UPDATE withdrawals SET status='completed', tx_ref=? WHERE id=?", [tx_ref, w.id]);
        await conn.query("UPDATE wallet_accounts SET pending_cashout = GREATEST(0, pending_cashout - ?) WHERE user_id=?", [w.amount, w.user_id]);
        await conn.query("INSERT INTO wallet_ledger (user_id,bucket,amount,balance_after,reason,ref_type,ref_id) VALUES (?,'cashout',?,?,?,?,?)",
          [w.user_id, -w.amount, 0, 'withdrawal_completed', 'withdrawal', w.id]);
      } else {
        await conn.query("UPDATE withdrawals SET status='rejected', admin_note=? WHERE id=?", [reason, w.id]);
        await conn.query("UPDATE wallet_accounts SET pending_cashout = GREATEST(0, pending_cashout - ?), main_balance = main_balance + ? WHERE user_id=?", [w.amount, w.amount, w.user_id]);
        await conn.query("INSERT INTO wallet_ledger (user_id,bucket,amount,balance_after,reason,ref_type,ref_id) VALUES (?,'main',?,(SELECT main_balance FROM wallet_accounts WHERE user_id=?),'withdrawal_refund','withdrawal',?)",
          [w.user_id, w.amount, w.user_id, w.id]);
      }
      await conn.commit();
    } finally { conn.release(); }
    await logAudit({ adminId: req.user.id, action: 'withdrawal_' + decision, entityType: 'withdrawal', entityId: req.params.id, meta: req.body });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---------- Deposit review v2 (processing/completed with fee-aware credit) ----------
router.post('/deposits/:id/review', async (req, res, next) => {
  try {
    const { decision, note = '' } = req.body || {};
    if (!['processing', 'completed', 'rejected'].includes(decision)) return res.status(400).json({ message: 'bad decision' });
    if (decision === 'rejected' && !note.trim()) return res.status(400).json({ message: 'Rejection reason required' });
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query('SELECT * FROM deposit_requests WHERE id=? FOR UPDATE', [req.params.id]);
      const d = rows[0];
      if (!d) { await conn.rollback(); return res.status(404).json({ message: 'Not found' }); }
      if (d.status !== 'pending' && d.status !== 'processing') { await conn.rollback(); return res.status(409).json({ message: 'Already processed (' + d.status + ')' }); }
      if (decision === 'processing') {
        await conn.query("UPDATE deposit_requests SET status='processing', admin_note=? WHERE id=?", [note, d.id]);
      } else if (decision === 'completed') {
        await conn.query("UPDATE deposit_requests SET status='completed', admin_note=? WHERE id=?", [note, d.id]);
        await conn.query("UPDATE wallet_accounts SET main_balance = main_balance + ? WHERE user_id=?", [d.amount, d.user_id]);
        await conn.query("INSERT INTO wallet_ledger (user_id,bucket,amount,balance_after,reason,ref_type,ref_id) VALUES (?,'main',?,(SELECT main_balance FROM wallet_accounts WHERE user_id=?),'deposit_completed','deposit',?)",
          [d.user_id, d.amount, d.user_id, d.id]);
      } else {
        await conn.query("UPDATE deposit_requests SET status='rejected', admin_note=? WHERE id=?", [note, d.id]);
      }
      await conn.commit();
    } finally { conn.release(); }
    await logAudit({ adminId: req.user.id, action: 'deposit_' + decision, entityType: 'deposit', entityId: req.params.id, meta: req.body });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---------- Dashboard aggregates ----------
router.get('/dashboard', async (req, res, next) => {
  try {
    const q = async (sql) => (await pool.query(sql))[0];
    const [users, activeUsers, tasks, cats, pendSub, procSub, doneSub, rejSub, paid, deposits, pendDep, wd, pendWd, doneWd] = await Promise.all([
      q('SELECT COUNT(*) c FROM users'), q("SELECT COUNT(*) c FROM users WHERE status='active'"),
      q('SELECT COUNT(*) c FROM tasks'), q('SELECT COUNT(*) c FROM task_categories'),
      q("SELECT COUNT(*) c FROM task_submissions WHERE status='pending'"), q("SELECT COUNT(*) c FROM task_submissions WHERE status='processing'"),
      q("SELECT COUNT(*) c FROM task_submissions WHERE status IN ('approved','completed')"), q("SELECT COUNT(*) c FROM task_submissions WHERE status='rejected'"),
      q("SELECT COALESCE(SUM(reward_amount),0) s FROM task_submissions WHERE status IN ('approved','completed')"),
      q('SELECT COALESCE(SUM(amount),0) s FROM deposit_requests'), q("SELECT COALESCE(SUM(amount),0) s FROM deposit_requests WHERE status IN ('pending','processing')"),
      q('SELECT COALESCE(SUM(amount),0) s FROM withdrawals'), q("SELECT COALESCE(SUM(amount),0) s FROM withdrawals WHERE status IN ('pending','processing')"),
      q("SELECT COALESCE(SUM(amount),0) s FROM withdrawals WHERE status IN ('completed')"),
    ]);
    const rows = [
      { id: 1, method: '👥 Total users', amount: users.c }, { id: 2, method: '🟢 Active users', amount: activeUsers.c },
      { id: 3, method: '📋 Total tasks', amount: tasks.c }, { id: 4, method: '🗂️ Categories', amount: cats.c },
      { id: 5, method: '⏳ Pending submissions', amount: pendSub.c }, { id: 6, method: '🔄 Processing submissions', amount: procSub.c },
      { id: 7, method: '✅ Approved/Completed', amount: doneSub.c }, { id: 8, method: '❌ Rejected', amount: rejSub.c },
      { id: 9, method: '💰 Total rewards paid', amount: paid.s }, { id: 10, method: '💵 Total deposits', amount: deposits.s },
      { id: 11, method: '⏳ Pending deposits', amount: pendDep.s }, { id: 12, method: '🏦 Total withdrawals', amount: wd.s },
      { id: 13, method: '⏳ Pending withdrawals', amount: pendWd.s }, { id: 14, method: '✅ Completed withdrawals', amount: doneWd.s },
    ];
    res.json(rows);
  } catch (e) { next(e); }
});


// ---------- Referral Leaderboard নোটিশ + পুরস্কার সেটিংস ----------
router.get('/notices', async (req, res, next) => { try { const [r] = await pool.query('SELECT * FROM notices ORDER BY sort_order, id'); res.json(r); } catch (e) { next(e); } });
router.post('/notices', async (req, res, next) => {
  try { const { text_bn, text_en = '', icon = '📢', sort_order = 0 } = req.body || {};
    if (!text_bn) return res.status(400).json({ message: 'text_bn required' });
    const [r] = await pool.query('INSERT INTO notices (text_bn,text_en,icon,sort_order) VALUES (?,?,?,?)', [text_bn, text_en, icon, sort_order]);
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
});
router.delete('/notices/:id', async (req, res, next) => {
  try { await pool.query('DELETE FROM notices WHERE id=?', [req.params.id]); res.json({ ok: true }); } catch (e) { next(e); }
});
router.get('/reflb', async (req, res, next) => {
  try { const [s] = await pool.query("SELECT `key`,`value` FROM settings WHERE `key` LIKE 'ref_%'"); const c = {}; for (const r of s) c[r.key] = r.value;
    res.json({ prize1: c.ref_prize_1, prize2: c.ref_prize_2, prize3: c.ref_prize_3, banner: c.ref_banner_title });
  } catch (e) { next(e); }
});
router.put('/reflb', async (req, res, next) => {
  try { const b = req.body || {};
    for (const [k, sk] of [['prize1','ref_prize_1'],['prize2','ref_prize_2'],['prize3','ref_prize_3'],['banner','ref_banner_title']]) {
      if (b[k] !== undefined && b[k] !== '') await pool.query('INSERT INTO settings (`key`,`value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)', [sk, String(b[k])]);
    }
    await logAudit({ adminId: req.user.id, action: 'reflb_update', entityType: 'settings', entityId: 0, meta: b });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
