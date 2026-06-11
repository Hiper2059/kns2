const User = require('../models/User');
const UserProfile = require('../models/UserProfile');

const teacherProfileFields = [
  'mainSubject',
  'certificates',
  'degree',
  'personalRecords',
  'teachingYears',
  'teachingClubs',
  'studentAchievements',
  'philosophy',
  'phone',
  'email',
  'fanpage',
  'address'
];

const studentProfileFields = [
  'dob',
  'className',
  'strengths',
  'goalsShort',
  'goalsLong',
  'teacherNote'
];

const getRoleProfileKey = role => {
  if (role === 'teacher') return 'teacher';
  if (role === 'student') return 'student';
  return null;
};

const compactObject = value => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const source = typeof value.toObject === 'function' ? value.toObject({ depopulate: true }) : value;
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

const assignStringFields = (target, source, fields) => {
  fields.forEach(field => {
    if (source?.[field] !== undefined) {
      target[field] = String(source[field]).trim();
    }
  });
};

const serializeProfileForRole = (profileSource, role) => {
  const source = compactObject(profileSource) || {};
  const profile = { ...source };
  const roleProfileKey = getRoleProfileKey(role);

  delete profile._id;
  delete profile.user;
  delete profile.createdAt;
  delete profile.updatedAt;
  delete profile.__v;

  if (roleProfileKey !== 'teacher') {
    delete profile.teacher;
  }

  if (roleProfileKey !== 'student') {
    delete profile.student;
  }

  return compactObject(profile) || {};
};

const buildProfilePayload = (user, input = {}) => {
  const legacyProfile = serializeProfileForRole(user?.profile, user?.role);
  const payload = { ...legacyProfile };

  if (input.displayName !== undefined) payload.displayName = String(input.displayName).trim();
  if (input.stageName !== undefined) payload.stageName = String(input.stageName).trim();
  if (input.avatarUrl !== undefined) payload.avatarUrl = String(input.avatarUrl).trim();
  if (input.bio !== undefined) payload.bio = String(input.bio).trim();

  const roleProfileKey = getRoleProfileKey(user?.role);
  if (roleProfileKey === 'teacher' && input.teacher && typeof input.teacher === 'object') {
    payload.teacher = { ...(payload.teacher || {}) };
    assignStringFields(payload.teacher, input.teacher, teacherProfileFields);
  }

  if (roleProfileKey === 'student' && input.student && typeof input.student === 'object') {
    payload.student = { ...(payload.student || {}) };
    assignStringFields(payload.student, input.student, studentProfileFields);
  }

  return compactObject(payload) || {};
};

const ensureUserProfile = async (user, input = {}) => {
  if (!user?._id) {
    return null;
  }

  const payload = buildProfilePayload(user, input);
  const update = { $setOnInsert: { user: user._id } };
  if (Object.keys(payload).length) {
    update.$set = payload;
  }

  return UserProfile.findOneAndUpdate(
    { user: user._id },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const getProfileForUser = async user => {
  if (!user?._id) {
    return {};
  }

  const profile = await UserProfile.findOne({ user: user._id }).lean();
  if (profile) {
    return serializeProfileForRole(profile, user.role);
  }

  return serializeProfileForRole(user.profile, user.role);
};

const updateProfileForUser = async (user, payload = {}) => {
  const profile = await ensureUserProfile(user, payload);
  return serializeProfileForRole(profile, user.role);
};

const getProfileMapByUserIds = async userIds => {
  const ids = [...new Set((userIds || []).map(item => String(item)).filter(Boolean))];
  if (!ids.length) {
    return {};
  }

  const profiles = await UserProfile.find({ user: { $in: ids } }).lean();
  return profiles.reduce((acc, profile) => {
    acc[String(profile.user)] = serializeProfileForRole(profile, null);
    return acc;
  }, {});
};

const getDisplayNameMapByUsernames = async usernames => {
  const names = [...new Set((usernames || []).map(item => String(item || '').trim()).filter(Boolean))];
  if (!names.length) {
    return {};
  }

  const users = await User.find({ username: { $in: names } }, { username: 1, role: 1, profile: 1 }).lean();
  const profileMap = await getProfileMapByUserIds(users.map(user => user._id));

  return users.reduce((acc, user) => {
    const profile = profileMap[String(user._id)] || serializeProfileForRole(user.profile, user.role);
    acc[user.username] = profile.displayName || user.username;
    return acc;
  }, {});
};

module.exports = {
  ensureUserProfile,
  getProfileForUser,
  updateProfileForUser,
  getProfileMapByUserIds,
  getDisplayNameMapByUsernames,
  serializeProfileForRole,
  compactObject
};
