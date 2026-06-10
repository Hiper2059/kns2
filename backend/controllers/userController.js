const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const { normalizeRole, allowedStatuses } = require('../utils/userUtils');
const { hashPassword } = require('../utils/password');
const { getPaginationParams, buildPagination } = require('../utils/pagination');
const catchAsync = require('../utils/catchAsync');

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
  if (role === 'teacher') {
    return 'teacher';
  }

  if (role === 'student') {
    return 'student';
  }

  return null;
};

const compactObject = value => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const source = typeof value.toObject === 'function' ? value.toObject() : value;
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

const serializeProfileForRole = user => {
  const source = compactObject(user.profile) || {};
  const roleProfileKey = getRoleProfileKey(user.role);
  const profile = { ...source };

  if (roleProfileKey !== 'teacher') {
    delete profile.teacher;
  }

  if (roleProfileKey !== 'student') {
    delete profile.student;
  }

  return compactObject(profile) || {};
};

const assignStringFields = (target, source, fields) => {
  fields.forEach(field => {
    if (source?.[field] !== undefined) {
      target[field] = String(source[field]).trim();
    }
  });
};

const createUser = catchAsync(async (req, res) => {
  const { username, password, role, displayName } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Thiếu username hoặc mật khẩu.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu cần từ 6 ký tự trở lên.' });
  }

  const normalizedUsername = username.trim();
  const existed = await User.findOne({ username: normalizedUsername }).lean();
  if (existed) {
    return res.status(400).json({ message: 'Tài khoản đã tồn tại.' });
  }

  const passwordHash = await hashPassword(password);
  const created = await User.create({
    username: normalizedUsername,
    passwordHash,
    role: normalizeRole(role),
    profile: {
      displayName: String(displayName || '').trim()
    }
  });

  res.status(201).json({
    message: 'Đã tạo tài khoản thành công.',
    user: { username: created.username, role: created.role, status: created.status }
  });
});

const listUsers = catchAsync(async (req, res) => {
  const filter = {};
  const projection = { username: 1, role: 1, status: 1, violationCount: 1, createdAt: 1, updatedAt: 1, _id: 0 };
  const { page, limit, skip } = getPaginationParams(req.query);
  const [safeUsers, totalItems] = await Promise.all([
    User.find(filter, projection)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter)
  ]);

  res.json({
    data: safeUsers,
    users: safeUsers,
    pagination: buildPagination({ totalItems, page, limit })
  });
});

const updateUserRole = catchAsync(async (req, res) => {
  const { username, role } = req.body;

  if (!username || !role) {
    return res.status(400).json({ message: 'Thiếu username hoặc role.' });
  }

  const user = await User.findOne({ username: username.trim() });
  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  }

  user.role = normalizeRole(role);
  await user.save();
  res.json({ message: 'Cập nhật vai trò thành công.' });
});

const updateUserStatus = catchAsync(async (req, res) => {
  const { username, status } = req.body;

  if (!username || !status) {
    return res.status(400).json({ message: 'Thiếu username hoặc status.' });
  }

  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ message: 'Status không hợp lệ.' });
  }

  const user = await User.findOne({ username: username.trim() });
  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  }

  user.status = status;
  await user.save();
  res.json({ message: 'Cập nhật trạng thái tài khoản thành công.' });
});

const deleteUser = catchAsync(async (req, res) => {
  const username = req.params.username?.trim();
  const adminUsername = req.currentUser?.username;

  if (!username) {
    return res.status(400).json({ message: 'Thiếu username cần xóa.' });
  }

  if (username === adminUsername) {
    return res.status(400).json({ message: 'Không thể tự xóa tài khoản admin đang đăng nhập.' });
  }

  const deleted = await User.findOneAndDelete({ username });
  if (!deleted) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  }

  res.json({ message: `Đã xóa tài khoản ${username}.` });
});

const buildPublicProfile = async user => {
  const profilePayload = {
    _id: user._id,
    username: user.username,
    role: user.role,
    profile: serializeProfileForRole(user)
  };

  if (user.role === 'teacher') {
    const courses = await Course.find({ teacher: user._id }, { title: 1 }).lean();
    profilePayload.managedCourses = courses.map(course => ({ _id: course._id, title: course.title }));
  }

  return profilePayload;
};

const getPublicProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = mongoose.Types.ObjectId.isValid(userId)
    ? await User.findById(userId).lean()
    : await User.findOne({ username: String(userId).trim() }).lean();
  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  }

  const profilePayload = await buildPublicProfile(user);
  res.json({ user: profilePayload });
});

const getMyProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.currentUser._id).lean();
  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  }

  const profilePayload = await buildPublicProfile(user);
  res.json({ user: profilePayload });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const payload = req.body || {};
  const user = await User.findById(req.currentUser._id);
  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  }

  const nextProfile = serializeProfileForRole(user);

  if (payload.displayName !== undefined) nextProfile.displayName = String(payload.displayName).trim();
  if (payload.stageName !== undefined) nextProfile.stageName = String(payload.stageName).trim();
  if (payload.avatarUrl !== undefined) nextProfile.avatarUrl = String(payload.avatarUrl).trim();
  if (payload.bio !== undefined) nextProfile.bio = String(payload.bio).trim();

  const roleProfileKey = getRoleProfileKey(user.role);

  if (roleProfileKey === 'teacher' && payload.teacher && typeof payload.teacher === 'object') {
    nextProfile.teacher = { ...(nextProfile.teacher || {}) };
    assignStringFields(nextProfile.teacher, payload.teacher, teacherProfileFields);
  }

  if (roleProfileKey === 'student' && payload.student && typeof payload.student === 'object') {
    nextProfile.student = { ...(nextProfile.student || {}) };
    assignStringFields(nextProfile.student, payload.student, studentProfileFields);
  }

  user.profile = compactObject(nextProfile);
  await user.save();

  const profilePayload = await buildPublicProfile(user.toObject());
  res.json({ message: 'Đã cập nhật hồ sơ.', user: profilePayload });
});

module.exports = {
  createUser,
  listUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getPublicProfile,
  getMyProfile,
  updateMyProfile
};
