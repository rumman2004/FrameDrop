import express from 'express';
import { register, login, getMe, updateAvatar } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/register',                          register);
router.post('/login',                             login);
router.get('/me',          protect,               getMe);
router.patch('/avatar',    protect, upload.single('avatar'), updateAvatar); // ← new

export default router;