// src/controllers/shareController.js
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import ShareSession from '../models/ShareSession.js';
import { cloudinary } from '../utils/cloudinary.js';

// ── Allowed expiry values (hours) ─────────────────────────────────────────
const ALLOWED_EXPIRY_HOURS = [1, 3, 6, 12, 24, 48];

// ── Safe owner fields — never expose hashed password ─────────────────────
const USER_FIELDS = 'name email avatar isAdmin createdAt';

// ── Helper: count owner share stats ──────────────────────────────────────
async function getOwnerStats(ownerId) {
  const now      = new Date();
  const sessions = await ShareSession.find({ owner: ownerId }).select('expiresAt');
  return {
    totalShares:  sessions.length,
    activeShares: sessions.filter(s => new Date(s.expiresAt) > now).length,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// CREATE SHARE
// POST /api/share
// Protected — requires auth
// ─────────────────────────────────────────────────────────────────────────
export const createShare = async (req, res) => {
  try {
    const {
      title  = '',
      pin    = '',
      expiry = 6,
    } = req.body;

    const files = req.files;

    // Validate title
    if (!title || !title.trim()) {
      return res.status(400).json({
        message: 'Folder name is required',
      });
    }

    if (title.trim().length > 80) {
      return res.status(400).json({
        message: 'Folder name must be 80 characters or fewer',
      });
    }

    // Validate files
    if (!files?.length) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Validate PIN (optional — if provided must be 4-8 digits)
    const pinStr = String(pin).trim();
    if (pinStr && (pinStr.length < 4 || pinStr.length > 8 || !/^\d+$/.test(pinStr))) {
      return res.status(400).json({
        message: 'PIN must be 4–8 digits',
      });
    }

    // Validate expiry
    const expiryNum = Number(expiry);
    if (!ALLOWED_EXPIRY_HOURS.includes(expiryNum)) {
      return res.status(400).json({
        message: `Expiry must be one of: ${ALLOWED_EXPIRY_HOURS.join(', ')} hours`,
      });
    }

    // Hash PIN (use default if none provided)
    const pinToHash  = pinStr || nanoid(16);
    const hashedPin  = await bcrypt.hash(pinToHash, 10);
    const hasPinSet  = Boolean(pinStr);

    // Build token & expiry
    const token     = nanoid(12);
    const expiresAt = new Date(Date.now() + expiryNum * 60 * 60 * 1_000);

    // Map uploaded files
    const fileData = files.map(f => ({
      publicId:     f.filename,
      url:          f.path,
      type:         f.mimetype.startsWith('video/') ? 'video' : 'image',
      originalName: f.originalname,
      size:         f.size,
    }));

    // Persist
    const session = await ShareSession.create({
      title:     title.trim(),
      token,
      pin:       hashedPin,
      hasPinSet,
      files:     fileData,
      owner:     req.user.id,
      expiresAt,
      isExpired: false,
    });

    return res.status(201).json({
      shareUrl:  `${process.env.CLIENT_URL}/share/${token}`,
      token,
      expiresAt,
      fileCount: files.length,
      title:     session.title,
      hasPinSet,
    });
  } catch (err) {
    console.error('createShare error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// GET SESSION BY ID  (owner-only, no PIN needed)
// GET /api/share/session/:id
// ─────────────────────────────────────────────────────────────────────────
export const getSessionById = async (req, res) => {
  try {
    const session = await ShareSession
      .findOne({
        _id:   req.params.id,
        owner: req.user.id,
      })
      .select('-pin')
      .populate('owner', USER_FIELDS);

    if (!session) {
      return res.status(404).json({ message: 'Share not found' });
    }

    if (new Date() > new Date(session.expiresAt)) {
      return res.status(410).json({ message: 'This share has expired' });
    }

    return res.json(session);
  } catch (err) {
    console.error('getSessionById error:', err);

    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Share not found' });
    }

    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// GET SHARE (public — metadata only, no files, no PIN required)
// GET /api/share/:token
// ─────────────────────────────────────────────────────────────────────────
export const getShare = async (req, res) => {
  try {
    const { token } = req.params;

    const session = await ShareSession
      .findOne({ token })
      .select('-pin')
      .populate('owner', USER_FIELDS);

    if (!session) {
      return res.status(404).json({ message: 'Share link not found' });
    }

    if (new Date() > new Date(session.expiresAt)) {
      return res.status(410).json({ message: 'This link has expired' });
    }

    const { totalShares, activeShares } = await getOwnerStats(session.owner._id);

    return res.json({
      token,
      title:      session.title     ?? '',
      fileCount:  session.files.length,
      photoCount: session.files.length,
      expiresAt:  session.expiresAt,
      createdAt:  session.createdAt,
      hasPinSet:  session.hasPinSet ?? true,
      user: {
        name:         session.owner.name,
        email:        session.owner.email,
        avatar:       session.owner.avatar   ?? '',
        isAdmin:      session.owner.isAdmin  ?? false,
        createdAt:    session.owner.createdAt,
        totalShares,
        activeShares,
      },
    });
  } catch (err) {
    console.error('getShare error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// VERIFY PIN  (public — returns files on success)
// POST /api/share/:token/verify
// ─────────────────────────────────────────────────────────────────────────
export const verifyPin = async (req, res) => {
  try {
    const { token } = req.params;
    const { pin }   = req.body;

    if (!pin) {
      return res.status(400).json({ message: 'PIN is required' });
    }

    const session = await ShareSession
      .findOne({ token })
      .populate('owner', USER_FIELDS);

    if (!session) {
      return res.status(404).json({ message: 'Share link not found' });
    }

    if (new Date() > new Date(session.expiresAt)) {
      return res.status(410).json({ message: 'This link has expired' });
    }

    const isMatch = await bcrypt.compare(String(pin), session.pin);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect PIN. Please try again.' });
    }

    session.downloadCount += 1;
    await session.save();

    const { totalShares, activeShares } = await getOwnerStats(session.owner._id);

    return res.json({
      files:      session.files,
      expiresAt:  session.expiresAt,
      createdAt:  session.createdAt,
      title:      session.title      ?? '',
      photoCount: session.files.length,
      user: {
        name:         session.owner.name,
        email:        session.owner.email,
        avatar:       session.owner.avatar   ?? '',
        isAdmin:      session.owner.isAdmin  ?? false,
        createdAt:    session.owner.createdAt,
        totalShares,
        activeShares,
      },
    });
  } catch (err) {
    console.error('verifyPin error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// GET USER'S OWN SHARES
// GET /api/share/my
// ─────────────────────────────────────────────────────────────────────────
export const getUserShares = async (req, res) => {
  try {
    const sessions = await ShareSession
      .find({ owner: req.user.id })
      .select('-pin')
      .sort({ createdAt: -1 });

    return res.json(sessions);
  } catch (err) {
    console.error('getUserShares error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────
// DELETE SHARE  (owner only — also removes files from Cloudinary)
// DELETE /api/share/:id
// ─────────────────────────────────────────────────────────────────────────
export const deleteShare = async (req, res) => {
  try {
    const session = await ShareSession.findOne({
      _id:   req.params.id,
      owner: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ message: 'Share not found or unauthorized' });
    }

    const results = await Promise.allSettled(
      session.files.map(f =>
        cloudinary.uploader.destroy(f.publicId, {
          resource_type: f.type === 'video' ? 'video' : 'image',
        })
      )
    );

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.warn(
          `⚠️ Cloudinary delete failed for ${session.files[i]?.publicId}:`,
          result.reason,
        );
      }
    });

    await session.deleteOne();

    return res.json({ message: 'Share deleted successfully' });
  } catch (err) {
    console.error('deleteShare error:', err);

    if (err.name === 'CastError') {
      return res.status(404).json({ message: 'Share not found' });
    }

    return res.status(500).json({ message: err.message });
  }
};