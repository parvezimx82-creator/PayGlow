import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../lib/errors.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.post('/tasks', asyncHandler(async (req, res) => {
  const d = z.object({
    titleBn: z.string().min(1).max(180), titleEn: z.string().min(1).max(180),
    descriptionBn: z.string().min(1), descriptionEn: z.string().min(1),
    category: z.string().min(1).max(60), payout: z.number().positive().max(100000),
    proofType: z.enum(['text','image','text_image']).default('text_image'),
    priority: z.enum(['normal','high']).default('normal')
  }).parse(req.body);
  const [r] = await pool.execute(
    'INSERT INTO tasks (title_bn,title_en,description_bn,description_en,category,payout,proof_type,priority,created_by) VALUES (?,?,?,?,?,?,?,?,?)',
    [d.titleBn,d.titleEn,d.descriptionBn,d.descriptionEn,d.category,d.payout,d.proofType,d.priority,req.user.id]
  );
  res.status(201).json({ id: r.insertId });
}));

router.patch('/tasks/:id/status', asyncHandler(async (req, res) => {
  const d = z.object({ status: z.enum(['active','inactive']) }).parse(req.body);
  const [r] = await pool.execute('UPDATE tasks SET status = ? WHERE id = ?', [d.status, Number(req.params.id)]);
  if (!r.affectedRows) throw new HttpError(404, 'Task not found');
  res.json({ ok: true });
}));

router.get('/submissions', asyncHandler(async (_req, res) => {
  const [rows] = await pool.execute(`
    SELECT s.id,s.task_id,s.user_id,s.proof_text,s.proof_image_url,s.status,s.submitted_at,
           t.title_en,t.payout,u.username
    FROM task_submissions s JOIN tasks t ON t.id=s.task_id JOIN users u ON u.id=s.user_id
    ORDER BY s.submitted_at DESC LIMIT 300
  `);
  res.json(rows);
}));

router.post('/submissions/:id/review', asyncHandler(async (req, res) => {
  const d = z.object({ decision: z.enum(['approved','rejected']), reason: z.string().max(500).optional().default('') }).parse(req.body);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(`
      SELECT s.id,s.user_id,s.task_id,s.status,t.payout
      FROM task_submissions s JOIN tasks t ON t.id=s.task_id WHERE s.id=? FOR UPDATE
    `, [Number(req.params.id)]);
    const s = rows[0];
    if (!s) throw new HttpError(404, 'Submission not found');
    if (s.status !== 'pending') throw new HttpError(409, 'Submission has already been reviewed');
    await conn.execute('UPDATE task_submissions SET status=?,review_note=?,reviewed_by=?,reviewed_at=NOW() WHERE id=?',
      [d.decision, d.reason || null, req.user.id, s.id]);
    if (d.decision === 'approved') {
      await conn.execute('UPDATE wallet_accounts SET main_balance=main_balance+? WHERE user_id=?', [s.payout, s.user_id]);
      await conn.execute("INSERT INTO wallet_ledger (user_id,amount,bucket,entry_type,reference_type,reference_id,note) VALUES (?,?,?,?,?,?,?)",
        [s.user_id, s.payout, 'main', 'credit', 'task_submission', s.id, 'Task approved']);
      // Referral reward is intentionally not silently auto-issued until the platform owner defines a verified reward policy.
    }
    await conn.commit();
    res.json({ ok: true, status: d.decision });
  } catch (e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
}));

router.get('/withdrawals', asyncHandler(async (_req, res) => {
  const [rows] = await pool.execute(`
    SELECT w.*,u.username FROM withdrawals w JOIN users u ON u.id=w.user_id
    ORDER BY w.created_at DESC LIMIT 300
  `);
  res.json(rows);
}));

router.post('/withdrawals/:id/status', asyncHandler(async (req, res) => {
  const d = z.object({ status: z.enum(['completed','refunded']), note: z.string().max(500).optional().default('') }).parse(req.body);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute('SELECT * FROM withdrawals WHERE id=? FOR UPDATE', [Number(req.params.id)]);
    const w = rows[0];
    if (!w) throw new HttpError(404, 'Withdrawal not found');
    if (w.status !== 'pending') throw new HttpError(409, 'Withdrawal is not pending');
    if (d.status === 'completed') {
      await conn.execute("UPDATE withdrawals SET status='completed',admin_note=? WHERE id=?", [d.note || null, w.id]);
      await conn.execute('UPDATE wallet_accounts SET pending_cashout=pending_cashout-? WHERE user_id=?', [w.amount, w.user_id]);
      await conn.execute("INSERT INTO wallet_ledger (user_id,amount,bucket,entry_type,reference_type,reference_id,note) VALUES (?,?,?,?,?,?,?)",
        [w.user_id, -w.amount, 'pending_cashout', 'debit', 'withdrawal', w.id, 'Withdrawal completed']);
    } else {
      await conn.execute("UPDATE withdrawals SET status='refunded',admin_note=? WHERE id=?", [d.note || 'Refunded by admin', w.id]);
      await conn.execute('UPDATE wallet_accounts SET main_balance=main_balance+?,pending_cashout=pending_cashout-? WHERE user_id=?', [w.amount,w.amount,w.user_id]);
      await conn.execute("INSERT INTO wallet_ledger (user_id,amount,bucket,entry_type,reference_type,reference_id,note) VALUES (?,?,?,?,?,?,?)",
        [w.user_id, w.amount, 'main', 'refund', 'withdrawal', w.id, 'Withdrawal refunded']);
      await conn.execute("INSERT INTO wallet_ledger (user_id,amount,bucket,entry_type,reference_type,reference_id,note) VALUES (?,?,?,?,?,?,?)",
        [w.user_id, -w.amount, 'pending_cashout', 'debit', 'withdrawal', w.id, 'Pending withdrawal refunded']);
    }
    await conn.commit();
    res.json({ ok: true, status: d.status });
  } catch (e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
}));


router.get('/deposits', asyncHandler(async (_req,res)=>{
 const [rows]=await pool.execute('SELECT d.*,u.username FROM deposit_requests d JOIN users u ON u.id=d.user_id ORDER BY d.created_at DESC LIMIT 300'); res.json(rows);
}));
router.post('/deposits/:id/review', asyncHandler(async(req,res)=>{
 const d=z.object({decision:z.enum(['approved','rejected']),note:z.string().max(500).optional().default('')}).parse(req.body);
 const conn=await pool.getConnection();
 try { await conn.beginTransaction();
  const [rows]=await conn.execute('SELECT * FROM deposit_requests WHERE id=? FOR UPDATE',[Number(req.params.id)]); const dep=rows[0];
  if(!dep) throw new HttpError(404,'Deposit request not found'); if(dep.status!=='pending') throw new HttpError(409,'Deposit request already reviewed');
  await conn.execute('UPDATE deposit_requests SET status=?,admin_note=?,reviewed_by=?,reviewed_at=NOW() WHERE id=?',[d.decision,d.note||null,req.user.id,dep.id]);
  if(d.decision==='approved') {
   await conn.execute('UPDATE wallet_accounts SET main_balance=main_balance+? WHERE user_id=?',[dep.amount,dep.user_id]);
   await conn.execute("INSERT INTO wallet_ledger (user_id,amount,bucket,entry_type,reference_type,reference_id,note) VALUES (?,?,?,?,?,?,?)",[dep.user_id,dep.amount,'main','credit','deposit',dep.id,'Deposit manually verified by admin']);
  }
  await conn.execute('INSERT INTO audit_logs (actor_user_id,action,target_type,target_id,ip_address,details) VALUES (?,?,?,?,?,?)',[req.user.id,'deposit_review','deposit',String(dep.id),req.ip,JSON.stringify({decision:d.decision,amount:dep.amount})]);
  await conn.commit(); res.json({ok:true,status:d.decision});
 } catch(e){await conn.rollback();throw e;} finally{conn.release();}
}));

router.get('/users', asyncHandler(async (_req, res) => {
  const [rows] = await pool.execute('SELECT id,full_name,username,email,role,status,referral_code,referred_by,created_at FROM users ORDER BY id DESC LIMIT 500');
  res.json(rows);
}));
router.patch('/users/:id/status', asyncHandler(async (req, res) => {
  const d = z.object({ status: z.enum(['active','banned']) }).parse(req.body);
  if (Number(req.params.id) === req.user.id) throw new HttpError(400, 'You cannot change your own account status');
  const [r] = await pool.execute('UPDATE users SET status=? WHERE id=?', [d.status, Number(req.params.id)]);
  if (!r.affectedRows) throw new HttpError(404, 'User not found');
  res.json({ ok: true });
}));
export default router;
