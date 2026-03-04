import mongoose from 'mongoose';

// ── File sub-schema ────────────────────────────────────────────────────────
const fileSchema = new mongoose.Schema(
  {
    publicId: {
      type:     String,
      required: true,
      trim:     true,
    },
    url: {
      type:     String,
      required: true,
      trim:     true,
    },
    type: {
      type:    String,
      enum:    ['image', 'video'],
      default: 'image',
    },
    originalName: {
      type:    String,
      default: '',
      trim:    true,
    },
    size: {
      type:    Number,
      default: 0,
      min:     0,
    },
  },
  { _id: true }
);

// ── Main schema ────────────────────────────────────────────────────────────
const shareSessionSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      default:   '',
      trim:      true,
      maxlength: 80,
    },

    token: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
    },

    // bcrypt hash — always populated even when owner didn't set a PIN
    pin: {
      type:     String,
      required: true,
    },

    // true  → owner set a real PIN, show PIN form on public page
    // false → no PIN, skip PIN form on public page
    hasPinSet: {
      type:    Boolean,
      default: true,
    },

    files: {
      type:    [fileSchema],
      default: [],
    },

    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    expiresAt: {
      type:     Date,
      required: true,
    },

    downloadCount: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // ── Cleanup flag ───────────────────────────────────────────────────
    // The cron job queries { cloudinaryPurged: false } to find sessions
    // whose Cloudinary files still need deleting.
    // After deleting from Cloudinary the cron job deletes the whole
    // MongoDB document, so this flag mainly prevents double-processing
    // if the server crashes mid-cleanup.
    //
    // ⚠️  NO MongoDB TTL INDEX on expiresAt.
    // A TTL index auto-deletes the document the moment it expires,
    // destroying the publicId list before the cron job can read it.
    // That permanently orphans every file in Cloudinary.
    // The cron job owns both steps: Cloudinary delete → document delete.
    cloudinaryPurged: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────

// Cron job query: expired sessions not yet purged
shareSessionSchema.index(
  { expiresAt: 1, cloudinaryPurged: 1 },
  { name: 'idx_cleanup' }
);

// Dashboard query: owner sessions newest-first
shareSessionSchema.index(
  { owner: 1, createdAt: -1 },
  { name: 'idx_owner_created' }
);

// Public share lookup by token
shareSessionSchema.index(
  { token: 1 },
  { name: 'idx_token' }
);

// ── Virtuals ───────────────────────────────────────────────────────────────
shareSessionSchema.virtual('isExpired').get(function () {
  return new Date() > new Date(this.expiresAt);
});

shareSessionSchema.virtual('fileCount').get(function () {
  return this.files.length;
});

// ── Statics ────────────────────────────────────────────────────────────────

// Uses countDocuments — never loads documents into memory just to count
shareSessionSchema.statics.getOwnerStats = async function (ownerId) {
  const now = new Date();
  const [totalShares, activeShares] = await Promise.all([
    this.countDocuments({ owner: ownerId }),
    this.countDocuments({ owner: ownerId, expiresAt: { $gt: now } }),
  ]);
  return { totalShares, activeShares };
};

// ── Instance methods ───────────────────────────────────────────────────────
shareSessionSchema.methods.incrementDownloads = function () {
  return this.model('ShareSession').updateOne(
    { _id: this._id },
    { $inc: { downloadCount: 1 } }
  );
};

// ── Hooks ──────────────────────────────────────────────────────────────────
shareSessionSchema.pre('save', function (next) {
  if (this.downloadCount < 0) this.downloadCount = 0;
  next();
});

const ShareSession = mongoose.model('ShareSession', shareSessionSchema);
export default ShareSession;