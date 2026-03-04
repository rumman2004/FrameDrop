import cloudinaryPkg from 'cloudinary';
import pkg from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// ── CommonJS default import fix for ES Modules ────────────────────────
const { v2: cloudinary } = cloudinaryPkg;
const { CloudinaryStorage } = pkg;

// ── Configure Cloudinary ──────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Verify config loaded ──────────────────────────────────────────────
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.warn('⚠️  Cloudinary env vars not set — check your .env file');
}

// ── Multer Cloudinary Storage ─────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder:        'framedrop',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi'],
      // Preserve original filename (sanitized)
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
    };
  },
});

export { cloudinary, storage };