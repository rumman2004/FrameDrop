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

// ── CORS — must be FIRST before everything else ────────────────────────────
// Handles the OPTIONS preflight that browsers send before every real request
const allowedOrigins = [
  process.env.CLIENT_URL
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Set CORS headers on every single response
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  // Preflight request — respond immediately with 200 and stop here
  // Browsers send OPTIONS before every cross-origin request
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Keep cors() package as well for compatibility
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

// ── Connect DB ─────────────────────────────────────────────────────────────
connectDB();

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Background cleanup middleware ──────────────────────────────────────────
app.use(cleanupMiddleware);

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

// ── Root check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ message: 'FrameDrop server is alive' });
});

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    method:  req.method,
    path:    req.originalUrl,
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

  import('./jobs/cleanupJob.js')
    .then(({ startCleanupJob }) => startCleanupJob())
    .catch(console.error);
}

// ── Vercel serverless export ───────────────────────────────────────────────
export default app;