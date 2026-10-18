import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

// Public: saved theme (persists across refresh; survives server restart)
router.get('/theme', async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT `key`,`value` FROM settings WHERE `key` LIKE 'theme_%'");
    const theme = {};
    for (const r of rows) theme[r.key] = r.value;
    res.json({
      primaryColor: theme.theme_primary_color || '#12b76a',
      secondaryColor: theme.theme_secondary_color || '#0e9384',
      gradientStart: theme.theme_gradient_start || '#12b76a',
      gradientEnd: theme.theme_gradient_end || '#0e9384',
      gradientDirection: theme.theme_gradient_direction || '135',
    });
  } catch (e) { next(e); }
});


// রেফারেল লিডারবোর্ড পাবলিক কনফিগ (পুরস্কার + ব্যানার + নোটিশ)
router.get('/reflb', async (req, res, next) => {
  try {
    const [s] = await pool.query("SELECT `key`,`value` FROM settings WHERE `key` IN ('ref_prize_1','ref_prize_2','ref_prize_3','ref_banner_title')");
    const cfg = {}; for (const r of s) cfg[r.key] = r.value;
    const [n] = await pool.query('SELECT id, text_bn, text_en, icon FROM notices WHERE active=1 ORDER BY sort_order, id');
    res.json({ prize1: +cfg.ref_prize_1 || 5000, prize2: +cfg.ref_prize_2 || 3000, prize3: +cfg.ref_prize_3 || 2000,
      banner: cfg.ref_banner_title || 'রেফারেল চ্যাম্পিয়নশিপ', notices: n });
  } catch (e) { next(e); }
});

export default router;
