import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import taskRoutes from './routes/tasks.js';
import referralRoutes from './routes/referrals.js';
import withdrawalRoutes from './routes/withdrawals.js';
import adminRoutes from './routes/admin.js';
import depositRoutes from './routes/deposits.js';
import settingsRouter from './routes/settings.js';
import adminExtra from './routes/admin_extra.js';
import historyRoutes from './routes/history.js';
import uploadRoutes from './routes/uploads.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim()), methods: ['GET','POST','PATCH','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '256kb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));
app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.get('/api/health', (_req,res) => res.json({ ok: true, service: 'PayGlow API' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false }), authRoutes);
app.use('/api', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/settings', settingsRouter);
app.use('/api/admin', adminExtra);
app.use('/api/history', historyRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) return res.status(400).json({ error: 'Invalid input', details: err.issues.map(i => ({ path: i.path.join('.'), message: i.message })) });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
});
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`PayGlow API listening on ${port}`));
