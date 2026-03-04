import ShareSession  from '../models/ShareSession.js';
import { cloudinary } from '../utils/cloudinary.js';

// ─────────────────────────────────────────────────────────────────────────────
// CORE CLEANUP LOGIC
// Shared between:
//   - runCleanup()         → called directly (cron endpoint / local dev)
//   - cleanupMiddleware()  → runs in background on every API request
// ─────────────────────────────────────────────────────────────────────────────

async function deleteCloudinaryFile(file) {
  const resourceType = file.type === 'video' ? 'video' : 'image';
  try {
    const result = await cloudinary.uploader.destroy(file.publicId, {
      resource_type: resourceType,
    });
    // 'ok'        → deleted
    // 'not found' → already gone, treat as success
    const ok = result.result === 'ok' || result.result === 'not found';
    return { ok, publicId: file.publicId, result: result.result };
  } catch (err) {
    return { ok: false, publicId: file.publicId, error: err.message };
  }
}

export async function runCleanup() {
  const startedAt = Date.now();
  console.log(`[Cleanup] ▶  ${new Date().toISOString()}`);

  try {
    const expired = await ShareSession.find({
      expiresAt: { $lte: new Date() },
      isExpired: false,
    });

    if (!expired.length) {
      console.log('[Cleanup] ✓  Nothing to clean up');
      return { processed: 0, totalFiles: 0, deletedFiles: 0, failedFiles: 0 };
    }

    console.log(`[Cleanup]    ${expired.length} expired session(s) found`);

    let totalFiles   = 0;
    let deletedFiles = 0;
    let failedFiles  = 0;

    for (const session of expired) {
      console.log(
        `[Cleanup]  → "${session.title || 'Untitled'}" ` +
        `[${session._id}] (${session.files.length} file(s))`
      );

      // Delete all files from Cloudinary in parallel
      const results = await Promise.allSettled(
        session.files.map(f => deleteCloudinaryFile(f))
      );

      for (const r of results) {
        totalFiles++;
        if (r.status === 'fulfilled' && r.value.ok) {
          deletedFiles++;
          console.log(`           ✅ ${r.value.publicId} — ${r.value.result}`);
        } else {
          failedFiles++;
          const detail = r.status === 'fulfilled'
            ? r.value.error
            : r.reason?.message ?? String(r.reason);
          console.warn(`           ⚠️  ${r.value?.publicId ?? '?'} — ${detail}`);
        }
      }

      // Mark expired → save → delete doc
      session.isExpired = true;
      await session.save();
      await session.deleteOne();
      console.log(`           🗑️  MongoDB doc deleted`);
    }

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);
    console.log(`[Cleanup] ■  Done in ${elapsed}s`);

    return { processed: expired.length, totalFiles, deletedFiles, failedFiles };

  } catch (err) {
    console.error('[Cleanup] ❌ Error:', err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND MIDDLEWARE
// Attach to your Express app so cleanup runs on every API request.
//
// Key design decisions:
//   ✅ Never blocks the response — cleanup runs AFTER res is sent
//   ✅ Rate-limited — only fires once per THROTTLE_MS window
//      so a burst of requests doesn't spawn 100 parallel cleanup jobs
//   ✅ Silent on errors — a cleanup failure never crashes a real request
// ─────────────────────────────────────────────────────────────────────────────

// Only run cleanup at most once every 10 minutes via middleware
// This is separate from the daily Vercel cron (which is the safety net)
const THROTTLE_MS = 10 * 60 * 1000; // 10 minutes
let lastCleanupAt = 0;
let cleanupRunning = false;

export function cleanupMiddleware(req, res, next) {
  // Always let the real request through immediately
  next();

  const now = Date.now();
  const due = now - lastCleanupAt >= THROTTLE_MS;

  // Skip if: not due yet, or already running, or this IS the cron endpoint
  if (!due || cleanupRunning || req.path === '/api/cron') return;

  // Run cleanup in the background — intentionally not awaited
  // so it never blocks or slows down the response
  cleanupRunning = true;
  lastCleanupAt  = now;

  runCleanup()
    .catch(err => console.error('[Cleanup Middleware] Error:', err.message))
    .finally(() => { cleanupRunning = false; });
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL DEV CRON
// Only used when running locally (NODE_ENV !== 'production').
// On Vercel, cleanup is handled by:
//   1. cleanupMiddleware (every ~10 min based on traffic)
//   2. vercel.json cron  (once per day safety net)
// ─────────────────────────────────────────────────────────────────────────────

export async function startCleanupJob() {
  if (process.env.NODE_ENV === 'production') {
    console.log('[Cleanup] Production mode — cron disabled, using middleware + Vercel cron');
    return;
  }

  // Lazy import node-cron so it's never bundled on Vercel
  const { default: cron } = await import('node-cron');

  // Run once immediately on startup
  console.log('[Cleanup] Running initial cleanup on startup…');
  await runCleanup().catch(console.error);

  // Then every 30 minutes locally
  cron.schedule('*/30 * * * *', () => {
    runCleanup().catch(console.error);
  });

  console.log('[Cleanup] ⏰ Local cron scheduled — every 30 minutes');
}