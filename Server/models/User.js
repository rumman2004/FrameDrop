import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true },
    password:       { type: String, required: true },
    isAdmin:        { type: Boolean, default: false },
    isDisabled:     { type: Boolean, default: false },
    avatar:         { type: String, default: '' },       // ← cloudinary URL
    avatarPublicId: { type: String, default: '' },       // ← for deletion
    lastLogin:      { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;