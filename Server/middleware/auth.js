import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ── Protect — any logged-in user ──────────────────────────────────────
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ message: 'Not authorized — no token' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── Attach fresh user from DB (catches disabled/deleted accounts) ─
    const user = await User.findById(decoded.id).select('-password');
    if (!user)
      return res.status(401).json({ message: 'User no longer exists' });

    if (user.isDisabled)
      return res.status(403).json({ message: 'Account disabled' });

    req.user = { id: user._id, isAdmin: user.isAdmin, email: user.email };
    next();
  } catch (err) {
    console.error('auth middleware error:', err.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ── Admin only ────────────────────────────────────────────────────────
export const adminOnly = (req, res, next) => {
  if (!req.user?.isAdmin)
    return res.status(403).json({ message: 'Admin access required' });
  next();
};

export default protect;