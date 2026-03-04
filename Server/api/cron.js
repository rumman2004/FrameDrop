// Vercel calls this endpoint on the schedule set in vercel.json.
// It does exactly what startCleanupJob() does locally —
// delete expired Cloudinary files then remove the session from MongoDB.

import dotenv from 'dotenv';
dotenv.config();

import connectDB    from '../config/db.js';
import ShareSession from '../models/ShareSession.js';
import { cloudinary } from '../utils/cloudinary.js';

// ── Delete one file from Cloudinary ──────────────────────────────────────
async function deleteCloudinaryFile(file) {
  const resourceType = file.type === 'video' ? 'video' : 'image';
  try {
    const result = await cloudinary.uploader.destroy(file.publicId, {
      resource_type: resourceType,
    });
    // 'ok'        = deleted successfully
    // 'not found' = already gone — treat as success so we don't loop forever
    const ok = result.result === 'ok' || result.result === 'not found';
    return { ok, publicId: file.publicId, cloudinaryResult: result.result };
  } catch (err) {
    return { ok: false, publicId: file.publicId, error: err.message };
  }
}

// ── Vercel serverless handler ─────────────────────────────────────────────
export default async function handler(req, res) {

  // Vercel cron always sends GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Guard — only Vercel's own cron scheduler (or your own calls with the
  // secret) can trigger this. Anyone else gets 401.
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('⛔ /api/cron called without valid CRON_SECRET');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const startedAt = Date.now();
  console.log(`\n[Cron] ▶  ${new Date().toISOString()}`);

  try {
    // Mongoose caches — safe to call every invocation
    await connectDB();

    const expired = await ShareSession.find({
      expiresAt: { $lte: new Date() },
      isExpired: false,
    });

    if (!expired.length) {
      console.log('[Cron] ✓  Nothing to clean up');
      return res.json({
        ok: true, processed: 0, message: 'Nothing to clean up',
      });
    }

    console.log(`[Cron]    ${expired.length} expired session(s) found`);

    let totalFiles   = 0;
    let deletedFiles = 0;
    let failedFiles  = 0;

    for (const session of expired) {
      console.log(
        `[Cron]  → "${session.title || 'Untitled'}" [${session._id}]` +
        `  (${session.files.length} file(s))`
      );

      // Delete all Cloudinary files for this session in parallel
      const results = await Promise.allSettled(
        session.files.map(f => deleteCloudinaryFile(f))
      );

      for (const r of results) {
        totalFiles++;
        if (r.status === 'fulfilled' && r.value.ok) {
          deletedFiles++;
          console.log(`        ✅ ${r.value.publicId} — ${r.value.cloudinaryResult}`);
        } else {
          failedFiles++;
          const detail = r.status === 'fulfilled'
            ? r.value.error
            : r.reason?.message ?? r.reason;
          console.warn(`        ⚠️  ${r.value?.publicId ?? '?'} — ${detail}`);
        }
      }

      // Mark expired then delete the document
      // We mark first so if deleteOne() fails the next cron run still
      // picks it up via isExpired:false, but Cloudinary files won't be
      // re-deleted (they returned 'not found' which we treat as ok)
      session.isExpired = true;
      await session.save();
      await session.deleteOne();
      console.log(`        🗑️  MongoDB document deleted`);
    }

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);
    console.log(`[Cron] ■  Done in ${elapsed}s\n`);

    return res.json({
      ok:           true,
      processed:    expired.length,
      totalFiles,
      deletedFiles,
      failedFiles,
      elapsedSec:   Number(elapsed),
    });

  } catch (err) {
    console.error('[Cron] ❌ Fatal:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}