import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  email: { type: String, default: 'system' },
  action: {
    type: String,
    enum: [
      'REGISTER',
      'LOGIN',
      'LOGIN_FAILED',
      'SHARE_CREATED',
      'SHARE_ACCESSED',
      'SHARE_DELETED',
      'SHARE_EXPIRED',
      'FILE_DOWNLOADED',
      'ADMIN_LOGIN',
      'USER_DISABLED',
      'USER_ENABLED',
    ],
    required: true,
  },
  meta: { type: Object, default: {} },   // extra details like IP, file count, etc.
  ip: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// Auto-delete logs older than 30 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model('ActivityLog', activityLogSchema);