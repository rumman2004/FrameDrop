import dotenv from 'dotenv';
dotenv.config();

import express     from 'express';
import cors        from 'cors';
import connectDB   from './config/db.js';
import authRoutes  from './routes/auth.js';
import shareRoutes from './routes/share.js';
import adminRoutes from './routes/admin.js';
import { cleanupMiddleware, runCleanup, startCleanupJob } from './jobs/cleanupJob.js';

const app = express();

// ── CORS SETUP ─────────────────────────────────────────────────────────────
// We define the config once to use it in both app.use() and app.options()
const corsOptions = {
  origin: (origin, callback) => {
    // Allow ALL origins dynamically
    callback(null, true);
  },
  credentials: true, // Allow cookies/headers
};

// 1. Apply CORS middleware generally
app.use(cors(corsOptions));

// 2. FORCE an explicit OK response for all OPTIONS requests
// This fixes the "Preflight... does not have HTTP ok status" error
app.options('*', cors(corsOptions));

// ── DB & Parsing ───────────────────────────────────────────────────────────
connectDB();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Background Middleware (Runs on every request) ──────────────────────────
app.use(cleanupMiddleware);

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/admin', adminRoutes);

// ── Cron Route (Moved from api/cron.js) ────────────────────────────────────
// Vercel Cron will hit this endpoint once a day
app.get('/api/cron', async (req, res) => {
  // Security check: verify the header matches your CRON_SECRET env var
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const stats = await runCleanup();
    res.json({ success: true, ...stats });
  } catch (err) {
    console.error('Cron failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

app.get('/', (_req, res) => {
  res.json({ message: 'FrameDrop API is running' });
});

// ── Error Handling ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// ── Local Development ──────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    startCleanupJob(); // Start local cron
  });
}

export default app;