import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';
const router=Router();
router.use(requireAuth);
router.get('/ledger',asyncHandler(async(req,res)=>{const [rows]=await pool.execute('SELECT id,amount,bucket,entry_type,reference_type,reference_id,note,created_at FROM wallet_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 200',[req.user.id]);res.json(rows);}));
router.get('/submissions',asyncHandler(async(req,res)=>{const [rows]=await pool.execute('SELECT s.id,s.task_id,s.proof_text,s.status,s.review_note,s.submitted_at,s.reviewed_at,t.title_bn,t.title_en,t.payout FROM task_submissions s JOIN tasks t ON t.id=s.task_id WHERE s.user_id=? ORDER BY s.submitted_at DESC LIMIT 100',[req.user.id]);res.json(rows);}));
export default router;
