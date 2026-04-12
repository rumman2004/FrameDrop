import dotenv from 'dotenv';
dotenv.config();

import express    from 'express';
import cors       from 'cors';
import connectDB  from './config/db.js';
import authRoutes  from './routes/auth.js';
import shareRoutes from './routes/share.js';
import adminRoutes from './routes/admin.js';

const app = express();

// ── Connect DB ─────────────────────────────────────────────────────────────
connectDB();

// ── CORS ───────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: (_origin, callback) => callback(null, true),
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Root — confirms API is alive ───────────────────────────────────────────
// This is what you were seeing as 404 — GET / had no handler
app.get('/', (_req, res) => {
  res.json({
    status:  'ok',
    message: 'FrameDrop API is running',
    version: '1.0.0',
  });
});

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:    'ok',
    message:   'FrameDrop API is running',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV ?? 'development',
  });
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/admin', adminRoutes);

// ── 404 — after all routes ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.url}`,
  });
});

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Server error:', err.message);
  res.status(err.status ?? 500).json({
    message: err.message ?? 'Internal server error',
  });
});

// ── Dev only ───────────────────────────────────────────────────────────────
if (!process.env.VERCEL) {
  import('./jobs/cleanupJob.js')
    .then(({ startCleanupJob }) => {
      const PORT = process.env.PORT ?? 5000;
      app.listen(PORT, () => {
        console.log(`🚀 Dev server → http://localhost:${PORT}`);
        startCleanupJob();
      });
    })
    .catch((err) => {
      console.error('Failed to start dev server:', err);
      process.exit(1);
    });
}

export default app;