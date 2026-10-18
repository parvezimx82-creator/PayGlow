import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../lib/errors.js';
import { notifyAdmin } from '../services/telegram.js';
const router = Router();
// ফি-সহ প্রিভিউ — জমা দেওয়ার আগেই ইউজার দেখবে (spec §7)
router.get('/quote', async (req, res, next) => {
  try {
    const amount = parseFloat(req.query.amount || '0');
    const method = String(req.query.method || '');
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    if (!['bkash','nagad','rocket','usdt','bitcoin'].includes(method)) return res.status(400).json({ message: 'Invalid method' });
    const fee = 10; // স্থির ১০ BDT ফি
    res.json({ amount, fee, total: amount + fee, method });
  } catch (e) { next(e); }
});

router.use(requireAuth);
// This records a payment claim only. Funds are credited only after an administrator verifies the transaction reference.
router.post('/', asyncHandler(async (req,res) => {
  const d = z.object({ method:z.enum(['bkash','nagad','rocket','usdt','bitcoin']), amount:z.number().finite().min(10).max(100000), senderNumber:z.string().trim().regex(/^\+?[0-9]{8,15}$/), transactionRef:z.string().trim().min(5).max(100).regex(/^[a-zA-Z0-9_-]+$/) }).parse(req.body);
  let r; try { [r] = await pool.execute('INSERT INTO deposit_requests (user_id,method,amount,sender_number,transaction_ref) VALUES (?,?,?,?,?)',[req.user.id,d.method,d.amount,d.senderNumber,d.transactionRef]); } catch(e) { if(e.code==='ER_DUP_ENTRY') throw new HttpError(409,'This transaction reference has already been submitted'); throw e; }
  await notifyAdmin(`Deposit claim #${r.insertId}\nUser ID: ${req.user.id}\nMethod: ${d.method}\nAmount: ${d.amount}\nReference: ${d.transactionRef}`);
  res.status(201).json({id:r.insertId,status:'pending',message:'Payment claim submitted for manual verification. No balance was credited yet.'});
}));
router.get('/', asyncHandler(async (req,res) => {
 const [rows]=await pool.execute('SELECT id,method,amount,sender_number,transaction_ref,status,admin_note,created_at,reviewed_at FROM deposit_requests WHERE user_id=? ORDER BY created_at DESC LIMIT 100',[req.user.id]); res.json(rows);
}));
export default router;
