import express from 'express';
import upload from '../middleware/upload.js';
import protect from '../middleware/auth.js';
import {
  createShare,
  getShare,
  getSessionById,
  verifyPin,
  getUserShares,
  deleteShare,
} from '../controllers/shareController.js';

const router = express.Router();

// ── Protected routes (must be authenticated) ──────────────────────────────
// IMPORTANT: specific string routes must come BEFORE wildcard /:param routes
// or Express will match /:token / /:id before reaching /my, /session/:id etc.

router.post(
  '/',                          // POST   /api/share
  protect,
  upload.array('files', 50),
  createShare,
);

router.get('/my',        protect, getUserShares);    // GET    /api/share/my
router.get('/session/:id', protect, getSessionById); // GET    /api/share/session/:id  ← owner view
router.delete('/:id',    protect, deleteShare);      // DELETE /api/share/:id

// ── Public routes ─────────────────────────────────────────────────────────
// These use /:token so they MUST come after all fixed-string routes above
router.get('/:token',         getShare);    // GET  /api/share/:token   (metadata only)
router.post('/:token/verify', verifyPin);   // POST /api/share/:token/verify

export default router;