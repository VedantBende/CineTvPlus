import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkUserId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'revoked'],
    default: 'pending',
    lowercase: true,
    trim: true
  },
  accessDuration: {
    type: String,
    default: 'permanent'
  },
  expiresAt: {
    type: Date,
    default: null
  },
  isPermanent: {
    type: Boolean,
    default: true
  },
  lastRevokedAt: {
    type: Date,
    default: null
  },
  revokedReason: {
    type: String,
    default: null
  },
  preferences: {
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark'
    },
    autoplay: {
      type: Boolean,
      default: true
    },
    quality: {
      type: String,
      enum: ['auto', '720p', '1080p'],
      default: 'auto'
    }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Extra indexes if needed (clerkUserId and email are already unique/indexed in field definitions)
userSchema.index({ status: 1, expiresAt: 1 });

const User = mongoose.model('User', userSchema);

export default User;
