import dotenv from 'dotenv';
dotenv.config();

import express    from 'express';
import cors       from 'cors';
import connectDB  from './config/db.js';
import authRoutes  from './routes/auth.js';
import shareRoutes from './routes/share.js';
import adminRoutes from './routes/admin.js';

const app = express();

// ── Connect DB ────────────────────────────────────────────────────────────
// Mongoose caches the connection internally — safe to call on every
// cold-start (Vercel serverless) and on normal server boot
connectDB();

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (Postman, mobile apps, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,
  })
);

// ── Body parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/admin', adminRoutes);

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:    'ok',
    message:   'FrameDrop API is running',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV ?? 'development',
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Server error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// ── Local dev — listen + start cron ───────────────────────────────────────
// On Vercel this block is skipped entirely.
// The cron job runs via vercel.json → api/cron.js instead.
if (process.env.NODE_ENV !== 'production') {
  const { startCleanupJob } = await import('./jobs/cleanupJob.js');
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`🚀 Dev server → http://localhost:${PORT}`);
    startCleanupJob();
  });
}

// ── Vercel serverless export ──────────────────────────────────────────────
// Vercel imports this file and calls the exported app directly.
// No port binding needed — Vercel handles all of that.
export default app;