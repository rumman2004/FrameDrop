import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { log } from '../utils/logger.js';
import { cloudinary } from '../utils/cloudinary.js';

const generateToken = (id, isAdmin = false) =>
  jwt.sign({ id, isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user   = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      password: hashed,
    });

    await log({ user: user._id, email, action: 'REGISTER', ip: req.ip });

    res.status(201).json({
      token: generateToken(user._id, false),
      user:  { id: user._id, name: user.name, email: user.email, isAdmin: false, avatar: user.avatar },
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      await log({ email, action: 'LOGIN_FAILED', ip: req.ip });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.isDisabled)
      return res.status(403).json({ message: 'Account disabled. Contact support.' });

    user.lastLogin = new Date();
    await user.save();

    await log({ user: user._id, email, action: user.isAdmin ? 'ADMIN_LOGIN' : 'LOGIN', ip: req.ip });

    res.json({
      token: generateToken(user._id, user.isAdmin),
      user:  { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, avatar: user.avatar },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id:        user._id,
      name:      user.name,
      email:     user.email,
      isAdmin:   user.isAdmin,
      avatar:    user.avatar,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ── Upload / change avatar ────────────────────────────────────────────
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: 'No image uploaded' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ── Delete old avatar from Cloudinary if it exists ────────────
    if (user.avatarPublicId) {
      await cloudinary.uploader.destroy(user.avatarPublicId).catch(() => {});
    }

    user.avatar         = req.file.path;      // cloudinary secure URL
    user.avatarPublicId = req.file.filename;  // cloudinary public_id
    await user.save();

    res.json({
      avatar: user.avatar,
      message: 'Avatar updated successfully',
    });
  } catch (err) {
    console.error('updateAvatar error:', err);
    res.status(500).json({ message: err.message });
  }
};