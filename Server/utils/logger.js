import mongoose from 'mongoose';

// ── Log Schema ────────────────────────────────────────────────────────
const logSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    email:  { type: String, default: 'unknown' },
    action: { type: String, required: true },
    ip:     { type: String, default: 'unknown' },
    meta:   { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const Log = mongoose.model('Log', logSchema);

// ── Logger function ───────────────────────────────────────────────────
export const log = async ({ user = null, email = 'unknown', action, ip = 'unknown', meta = {} }) => {
  try {
    await Log.create({ user, email, action, ip, meta });
  } catch (err) {
    // Never let logging crash the app
    console.warn('⚠️  Logger failed silently:', err.message);
  }
};

export default Log;