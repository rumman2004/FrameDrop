// src/jobs/cleanupJob.js
import cron from 'node-cron';
import ShareSession from '../models/ShareSession.js';
import { cloudinary } from '../utils/cloudinary.js';

export const startCleanupJob = () => {
  // Runs every 30 minutes. For testing, you can use '* * * * *' (every minute).
  cron.schedule('*/30 * * * *', async () => {
    console.log('🧹 Running cleanup job for expired shares...');

    try {
      const now = new Date();

      // 1. Find sessions that have expired and not yet processed
      const expiredSessions = await ShareSession.find({
        expiresAt: { $lte: now },
        isExpired: false,
      });

      if (!expiredSessions.length) {
        console.log('No expired sessions to clean up.');
        return;
      }

      for (const session of expiredSessions) {
        console.log(`Cleaning session ${session._id} (token=${session.token})`);

        // 2. Delete Cloudinary files
        const deleteResults = await Promise.allSettled(
          session.files.map((f) =>
            cloudinary.uploader.destroy(f.publicId, {
              resource_type: f.type === 'video' ? 'video' : 'image',
            })
          )
        );

        deleteResults.forEach((result, i) => {
          const f = session.files[i];
          if (result.status === 'fulfilled') {
            console.log(`  ✅ Deleted Cloudinary file: ${f.publicId}`);
          } else {
            console.warn(`  ⚠️ Failed to delete ${f.publicId}:`, result.reason);
          }
        });

        // 3. Mark as expired and remove from DB
        session.isExpired = true;
        await session.save();        // keep audit trail if you want, then:
        await session.deleteOne();   // actually remove the doc

        console.log(`  🗑️ Session ${session._id} removed from MongoDB.`);
      }

      console.log(`✅ Cleanup job finished (processed ${expiredSessions.length} sessions).`);
    } catch (err) {
      console.error('❌ Cleanup job error:', err);
    }
  });
};