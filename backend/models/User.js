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
      enum: ['admin', 'teacher', 'student', 'user'],
      default: 'student'
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
    },
    profile: {
      displayName: {
        type: String,
        default: ''
      },
      stageName: {
        type: String,
        default: ''
      },
      avatarUrl: {
        type: String,
        default: ''
      },
      bio: {
        type: String,
        default: ''
      },
      teacher: {
        mainSubject: { type: String, default: '' },
        certificates: { type: String, default: '' },
        degree: { type: String, default: '' },
        personalRecords: { type: String, default: '' },
        teachingYears: { type: String, default: '' },
        teachingClubs: { type: String, default: '' },
        studentAchievements: { type: String, default: '' },
        philosophy: { type: String, default: '' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' },
        fanpage: { type: String, default: '' },
        address: { type: String, default: '' }
      },
      student: {
        dob: { type: String, default: '' },
        className: { type: String, default: '' },
        strengths: { type: String, default: '' },
        goalsShort: { type: String, default: '' },
        goalsLong: { type: String, default: '' },
        teacherNote: { type: String, default: '' }
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
