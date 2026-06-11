const mongoose = require('mongoose');

const teacherProfileSchema = new mongoose.Schema(
  {
    mainSubject: { type: String, trim: true },
    certificates: { type: String, trim: true },
    degree: { type: String, trim: true },
    personalRecords: { type: String, trim: true },
    teachingYears: { type: String, trim: true },
    teachingClubs: { type: String, trim: true },
    studentAchievements: { type: String, trim: true },
    philosophy: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    fanpage: { type: String, trim: true },
    address: { type: String, trim: true }
  },
  { _id: false, minimize: true }
);

const studentProfileSchema = new mongoose.Schema(
  {
    dob: { type: String, trim: true },
    className: { type: String, trim: true },
    strengths: { type: String, trim: true },
    goalsShort: { type: String, trim: true },
    goalsLong: { type: String, trim: true },
    teacherNote: { type: String, trim: true }
  },
  { _id: false, minimize: true }
);

const userProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    displayName: { type: String, trim: true },
    stageName: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    bio: { type: String, trim: true },
    teacher: {
      type: teacherProfileSchema,
      default: undefined
    },
    student: {
      type: studentProfileSchema,
      default: undefined
    }
  },
  {
    timestamps: true,
    minimize: true
  }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);
