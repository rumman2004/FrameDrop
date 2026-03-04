import express from 'express';
import { adminProtect } from '../middleware/adminAuth.js';
import {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getAllSessions,
  getActivityLogs,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(adminProtect); // all admin routes protected

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/sessions', getAllSessions);
router.get('/logs', getActivityLogs);

export default router;