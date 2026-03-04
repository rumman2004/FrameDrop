import multer from 'multer';
import { storage } from '../utils/cloudinary.js';  // ✅ gets storage from cloudinary.js

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/jpg', 'image/png',
    'image/gif',  'image/webp',
    'video/mp4',  'video/quicktime', 'video/x-msvideo',
  ];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error(`File type not allowed: ${file.mimetype}`), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
    files: 50,
  },
});

export default upload;  // ✅ default export