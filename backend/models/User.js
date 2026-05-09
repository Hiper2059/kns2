const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      default: null
    },
    passwordHash: {
      type: String,
      default: null
    },
    refreshTokenHash: {
      type: String,
      default: null
    },
    signatureTokenHash: {
      type: String,
      default: null
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user'
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active'
    },
    violationCount: {
      type: Number,
      default: 0
    },
    lastViolationAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
