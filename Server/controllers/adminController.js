import os from 'os';
import User from '../models/User.js';
import ShareSession from '../models/ShareSession.js';
import ActivityLog from '../models/ActivityLog.js';
import { cloudinary } from '../utils/cloudinary.js';
import { log } from '../utils/logger.js';

// ── Dashboard Overview ──────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      disabledUsers,
      totalSessions,
      activeSessions,
      expiredSessions,
      recentLogs,
    ] = await Promise.all([
      User.countDocuments({ isAdmin: false }),
      User.countDocuments({ isDisabled: true }),
      ShareSession.countDocuments(),
      ShareSession.countDocuments({ expiresAt: { $gt: new Date() }, isExpired: false }),
      ShareSession.countDocuments({ isExpired: true }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email'),
    ]);

    // Cloudinary usage
    const cloudUsage = await cloudinary.api.usage();

    // Server load
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = ((usedMem / totalMem) * 100).toFixed(1);
    const uptimeSeconds = os.uptime();

    // CPU load average (1 min) as a percentage estimate
    const loadAvg = os.loadavg()[0];
    const cpuCount = cpus.length;
    const cpuPercent = Math.min(((loadAvg / cpuCount) * 100).toFixed(1), 100);

    res.json({
      users: { total: totalUsers, disabled: disabledUsers, active: totalUsers - disabledUsers },
      sessions: { total: totalSessions, active: activeSessions, expired: expiredSessions },
      storage: {
        usedGB: (cloudUsage.storage.usage / 1e9).toFixed(2),
        limitGB: (cloudUsage.storage.limit / 1e9).toFixed(2),
        usedPercent: ((cloudUsage.storage.usage / cloudUsage.storage.limit) * 100).toFixed(1),
        bandwidth: {
          usedGB: (cloudUsage.bandwidth.usage / 1e9).toFixed(2),
          limitGB: (cloudUsage.bandwidth.limit / 1e9).toFixed(2),
        },
        transformations: cloudUsage.transformations,
      },
      serverLoad: {
        cpuPercent: parseFloat(cpuPercent),
        memUsedGB: (usedMem / 1e9).toFixed(2),
        memTotalGB: (totalMem / 1e9).toFixed(2),
        memPercent: parseFloat(memPercent),
        uptimeSeconds,
        uptimeFormatted: formatUptime(uptimeSeconds),
      },
      recentLogs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Users ────────────────────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = {
      isAdmin: false,
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    // Attach share count per user
    const userIds = users.map((u) => u._id);
    const shareCounts = await ShareSession.aggregate([
      { $match: { owner: { $in: userIds } } },
      { $group: { _id: '$owner', count: { $sum: 1 } } },
    ]);
    const shareMap = Object.fromEntries(shareCounts.map((s) => [s._id.toString(), s.count]));

    const enriched = users.map((u) => ({
      ...u.toObject(),
      shareCount: shareMap[u._id.toString()] || 0,
    }));

    res.json({ users: enriched, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isAdmin)
      return res.status(404).json({ message: 'User not found' });

    user.isDisabled = !user.isDisabled;
    await user.save();

    await log({
      action: user.isDisabled ? 'USER_DISABLED' : 'USER_ENABLED',
      email: user.email,
      meta: { adminId: req.user.id },
    });

    res.json({ message: `User ${user.isDisabled ? 'disabled' : 'enabled'}`, isDisabled: user.isDisabled });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Sessions ─────────────────────────────────────────────────────────
export const getAllSessions = async (req, res) => {
  try {
    const { page = 1, limit = 20, filter = 'all' } = req.query;
    const now = new Date();
    const query =
      filter === 'active'
        ? { expiresAt: { $gt: now }, isExpired: false }
        : filter === 'expired'
        ? { $or: [{ expiresAt: { $lte: now } }, { isExpired: true }] }
        : {};

    const [sessions, total] = await Promise.all([
      ShareSession.find(query)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select('-pin'),   // never expose hashed PIN
      ShareSession.countDocuments(query),
    ]);

    res.json({ sessions, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Logs ──────────────────────────────────────────────────────────────
export const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 30, action = '' } = req.query;
    const query = action ? { action } : {};

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments(query),
    ]);

    res.json({ logs, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Helpers ───────────────────────────────────────────────────────────
const formatUptime = (seconds) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
};