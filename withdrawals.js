import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../lib/errors.js';
import { notifyAdmin } from '../services/telegram.js';

const router = Router();
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const data = z.object({
    method: z.enum(['bkash','nagad','rocket']),
    phoneNumber: z.string().trim().min(8).max(32),
    amount: z.number().finite().positive().max(1000000)
  }).parse(req.body);
  const min = Number(process.env.MIN_WITHDRAWAL || 100);
  const feeRate = Number(process.env.WITHDRAWAL_FEE_RATE || 0.02);
  if (data.amount < min) throw new HttpError(400, `Minimum withdrawal is ${min}`);
  const fee = Math.round(data.amount * feeRate * 100) / 100;
  const net = Math.round((data.amount - fee) * 100) / 100;
  const conn = await pool.getConnection();
  let withdrawalId;
  try {
    await conn.beginTransaction();
    const [wallets] = await conn.execute('SELECT main_balance FROM wallet_accounts WHERE user_id = ? FOR UPDATE', [req.user.id]);
    if (!wallets[0] || wallets[0].main_balance < data.amount) throw new HttpError(400, 'Insufficient balance');
    await conn.execute('UPDATE wallet_accounts SET main_balance = main_balance - ?, pending_cashout = pending_cashout + ? WHERE user_id = ?', [data.amount, data.amount, req.user.id]);
    const [result] = await conn.execute(
      'INSERT INTO withdrawals (user_id, method, phone_number, amount, fee, net_amount) VALUES (?,?,?,?,?,?)',
      [req.user.id, data.method, data.phoneNumber, data.amount, fee, net]
    );
    withdrawalId = result.insertId;
    await conn.execute(
      "INSERT INTO wallet_ledger (user_id, amount, bucket, entry_type, reference_type, reference_id, note) VALUES (?,?,?,?,?,?,?)",
      [req.user.id, -data.amount, 'main', 'debit', 'withdrawal', withdrawalId, 'Withdrawal requested']
    );
    await conn.execute(
      "INSERT INTO wallet_ledger (user_id, amount, bucket, entry_type, reference_type, reference_id, note) VALUES (?,?,?,?,?,?,?)",
      [req.user.id, data.amount, 'pending_cashout', 'credit', 'withdrawal', withdrawalId, 'Withdrawal pending']
    );
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
  await notifyAdmin(`Withdrawal request\nUser ID: ${req.user.id}\nWithdrawal ID: ${withdrawalId}\nAmount: ${data.amount}\nMethod: ${data.method}\nPhone: ${data.phoneNumber}`);
  res.status(201).json({ id: withdrawalId, amount: data.amount, fee, netAmount: net, status: 'pending' });
}));
export default router;
