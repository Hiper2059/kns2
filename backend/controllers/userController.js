const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { normalizeRole, allowedStatuses } = require('../utils/userUtils');
const { hashPassword } = require('../utils/password');
const { getPaginationParams, buildPagination } = require('../utils/pagination');
const catchAsync = require('../utils/catchAsync');
const {
  ensureUserProfile,
  getDisplayNameMapByUsernames,
  getProfileForUser,
  updateProfileForUser
} = require('../services/userProfileService');
const { hardDeleteUserCascade } = require('../services/userDeletionService');

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
    role: normalizeRole(role)
  });
  await ensureUserProfile(created, { displayName });

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
  const displayNameMap = await getDisplayNameMapByUsernames(safeUsers.map(user => user.username));
  const usersWithProfiles = safeUsers.map(user => ({
    ...user,
    displayName: displayNameMap[user.username] && displayNameMap[user.username] !== user.username ? displayNameMap[user.username] : '',
    profile: {
      displayName: displayNameMap[user.username] && displayNameMap[user.username] !== user.username ? displayNameMap[user.username] : ''
    }
  }));

  res.json({
    data: usersWithProfiles,
    users: usersWithProfiles,
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

const updateUserDetails = catchAsync(async (req, res) => {
  const { username } = req.params;
  const { displayName, password } = req.body;

  const user = await User.findOne({ username: username.trim() });
  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  }

  if (displayName !== undefined) {
    await ensureUserProfile(user, { displayName });
  }

  if (password && password.trim()) {
    user.passwordHash = await hashPassword(password.trim());
    user.password = undefined;
  }

  await user.save();
  res.json({ message: 'Cập nhật thông tin người dùng thành công.' });
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
    return res.status(400).json({ message: 'Thieu username can xoa.' });
  }

  if (username === adminUsername) {
    return res.status(400).json({ message: 'Khong the tu xoa tai khoan admin dang dang nhap.' });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).json({ message: 'Khong tim thay nguoi dung.' });
  }

  const deletedCounts = await hardDeleteUserCascade(user);
  res.json({ message: `Da xoa tai khoan ${username}.`, deletedCounts });
});
const buildPublicProfile = async user => {
  const profile = await getProfileForUser(user);
  const profilePayload = {
    _id: user._id,
    username: user.username,
    role: user.role,
    points: user.points || 0,
    profile
  };

  if (user.role === 'teacher') {
    const courses = await Course.find({ teacher: user._id }, { title: 1 }).lean();
    profilePayload.managedCourses = courses.map(course => ({ _id: course._id, title: course.title }));
  } else if (user.role === 'student' || user.role === 'user') {
    const enrollments = await Enrollment.find({ student: user._id }).populate('course', 'title').lean();
    profilePayload.enrolledCourses = enrollments
      .filter(e => e.course)
      .map(e => ({ _id: e.course._id, title: e.course.title }));
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
    return res.status(404).json({ message: 'Khong tim thay nguoi dung.' });
  }

  await updateProfileForUser(user, payload);
  const profilePayload = await buildPublicProfile(user.toObject());
  res.json({ message: 'Da cap nhat ho so.', user: profilePayload });
});
module.exports = {
  createUser,
  listUsers,
  updateUserRole,
  updateUserStatus,
  updateUserDetails,
  deleteUser,
  getPublicProfile,
  getMyProfile,
  updateMyProfile
};
