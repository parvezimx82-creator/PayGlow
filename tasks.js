import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../lib/errors.js';
import { notifyAdmin } from '../services/telegram.js';

const router = Router();
// ইনস্টাগ্রাম 2FA — সার্ভার-সাইড TOTP (RFC 6238)
import crypto from 'node:crypto';
router.get('/totp', async (req, res, next) => {
  try {
    const key = String(req.query.key || '').replace(/\s+/g, '').toUpperCase();
    if (!/^[A-Z2-7]{16,64}$/.test(key)) return res.status(400).json({ message: 'Invalid 2FA key' });
    const k = Buffer.from(key + '='.repeat((-key.length) % 8), 'base64');
    const counter = Math.floor(Date.now() / 1000 / 30);
    const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(counter));
    const digest = crypto.createHmac('sha1', k).update(msg).digest();
    const off = digest[digest.length - 1] & 0x0f;
    const code = (digest.readUInt32BE(off) & 0x7fffffff) % 1000000;
    res.json({ code: String(code).padStart(6, '0') });
  } catch (e) { next(e); }
});

router.get('/', requireAuth, asyncHandler(async (_req, res) => {
  const [rows] = await pool.execute("SELECT id, title_bn, title_en, description_bn, description_en, category, payout, proof_type, priority FROM tasks WHERE status = 'active' ORDER BY priority DESC, id DESC");
  res.json(rows);
}));
router.post('/:id/submissions', requireAuth, asyncHandler(async (req, res) => {
  const taskId = Number(req.params.id);
  const data = z.object({ proofText: z.string().trim().max(5000).optional().default(''), proofImageUrl: z.string().url().max(500).optional().or(z.literal('')) }).parse(req.body);
  const [tasks] = await pool.execute("SELECT id, title_en, priority FROM tasks WHERE id = ? AND status = 'active'", [taskId]);
  if (!tasks[0]) throw new HttpError(404, 'Task not found');
  if (!data.proofText && !data.proofImageUrl) throw new HttpError(400, 'Please submit text or image proof');
  try {
    const [result] = await pool.execute(
      'INSERT INTO task_submissions (task_id, user_id, proof_text, proof_image_url) VALUES (?,?,?,?)',
      [taskId, req.user.id, data.proofText || null, data.proofImageUrl || null]
    );
    if (tasks[0].priority === 'high') await notifyAdmin(`High-priority proof submitted\nUser ID: ${req.user.id}\nTask: ${tasks[0].title_en}\nSubmission ID: ${result.insertId}`);
    res.status(201).json({ id: result.insertId, status: 'pending' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'You have already submitted this task');
    throw e;
  }
}));
export default router;
