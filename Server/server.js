import dotenv from 'dotenv';
dotenv.config();

import express     from 'express';
import cors        from 'cors';
import connectDB   from './config/db.js';
import authRoutes  from './routes/auth.js';
import shareRoutes from './routes/share.js';
import adminRoutes from './routes/admin.js';
import { cleanupMiddleware } from './jobs/cleanupJob.js';

const app = express();

// ── Connect DB ─────────────────────────────────────────────────────────────
connectDB();

// ── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,
  })
);

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Background cleanup middleware ──────────────────────────────────────────
app.use(cleanupMiddleware);

// ── Debug middleware — REMOVE after fixing ─────────────────────────────────
// Logs every incoming request so you can see what URL Vercel is sending
app.use((req, _res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/admin', adminRoutes);

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:    'ok',
    message:   'FrameDrop API is running',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV ?? 'development',
  });
});

// ── Root check — confirms Express is booting ───────────────────────────────
app.get('/', (_req, res) => {
  res.json({ message: 'FrameDrop server is alive' });
});

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  console.log(`❌ 404 — no route matched: [${req.method}] ${req.originalUrl}`);
  res.status(404).json({
    message:  'Route not found',
    method:   req.method,
    path:     req.originalUrl,   // ← this will tell you exactly what was called
  });
});

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Server error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// ── Local dev only ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Dev server → http://localhost:${PORT}`);
  });

  // start local cron only in dev — dynamic import avoids bundling issues
  import('./jobs/cleanupJob.js')
    .then(({ startCleanupJob }) => startCleanupJob())
    .catch(console.error);
}

// ── Vercel serverless export ───────────────────────────────────────────────
export default app;