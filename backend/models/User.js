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
  { _id: false, minimize: true }
);

const compactObject = value => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const source = typeof value.toObject === 'function'
    ? value.toObject({ depopulate: true })
    : value;

  const compacted = Object.entries(source).reduce((acc, [key, item]) => {
    if (item === undefined || item === null || item === '') {
      return acc;
    }

    if (typeof item === 'object' && !Array.isArray(item)) {
      const nested = compactObject(item);
      if (nested && Object.keys(nested).length) {
        acc[key] = nested;
      }
      return acc;
    }

    acc[key] = item;
    return acc;
  }, {});

  return Object.keys(compacted).length ? compacted : undefined;
};

const getRoleProfileKey = role => {
  if (role === 'teacher') {
    return 'teacher';
  }

  if (role === 'student') {
    return 'student';
  }

  return null;
};

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
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
      enum: ['admin', 'teacher', 'student'],
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
      type: userProfileSchema,
      default: undefined
    }
  },
  {
    timestamps: true,
    minimize: true
  }
);

userSchema.pre('validate', function pruneRoleSpecificProfile() {
  if (!this.profile) {
    return;
  }

  const roleProfileKey = getRoleProfileKey(this.role);
  const profile = typeof this.profile.toObject === 'function'
    ? this.profile.toObject({ depopulate: true })
    : { ...this.profile };

  if (roleProfileKey !== 'teacher') {
    delete profile.teacher;
  }

  if (roleProfileKey !== 'student') {
    delete profile.student;
  }

  this.profile = compactObject(profile);
});

module.exports = mongoose.model('User', userSchema);
