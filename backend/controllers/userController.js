const User = require('../models/User');
const Course = require('../models/Course');
const { normalizeRole, allowedStatuses } = require('../utils/userUtils');
const { hashPassword } = require('../utils/password');

const createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

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

    res.status(201).json({
      message: 'Đã tạo tài khoản thành công.',
      user: { username: created.username, role: created.role, status: created.status }
    });
  } catch (error) {
    console.error('Loi tao user:', error);
    res.status(500).json({ message: 'Không tạo được tài khoản.' });
  }
};

const listUsers = async (req, res) => {
  try {
    const safeUsers = await User.find(
      {},
      { username: 1, role: 1, status: 1, violationCount: 1, createdAt: 1, updatedAt: 1, _id: 0 }
    )
      .sort({ createdAt: -1 })
      .lean();
    res.json({ users: safeUsers });
  } catch (error) {
    console.error('Loi lay danh sach user:', error);
    res.status(500).json({ message: 'Không tải được danh sách user.' });
  }
};

const updateUserRole = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Loi cap nhat role:', error);
    res.status(500).json({ message: 'Không cập nhật được vai trò user.' });
  }
};

const updateUserStatus = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Loi cap nhat status:', error);
    res.status(500).json({ message: 'Không cập nhật được trạng thái tài khoản.' });
  }
};

const deleteUser = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Loi xoa user:', error);
    res.status(500).json({ message: 'Không xóa được tài khoản.' });
  }
};

const buildPublicProfile = async user => {
  const profilePayload = {
    _id: user._id,
    username: user.username,
    role: user.role,
    profile: user.profile || {}
  };

  if (user.role === 'teacher') {
    const courses = await Course.find({ teacher: user._id }, { title: 1 }).lean();
    profilePayload.managedCourses = courses.map(course => ({ _id: course._id, title: course.title }));
  }

  return profilePayload;
};

const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    const profilePayload = await buildPublicProfile(user);
    res.json({ user: profilePayload });
  } catch (error) {
    console.error('Loi lay profile:', error);
    res.status(500).json({ message: 'Không tải được hồ sơ.' });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.currentUser._id).lean();
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    const profilePayload = await buildPublicProfile(user);
    res.json({ user: profilePayload });
  } catch (error) {
    console.error('Loi lay profile ca nhan:', error);
    res.status(500).json({ message: 'Không tải được hồ sơ.' });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const payload = req.body || {};
    const user = await User.findById(req.currentUser._id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    const nextProfile = {
      ...(user.profile || {})
    };

    if (payload.displayName !== undefined) nextProfile.displayName = String(payload.displayName).trim();
    if (payload.stageName !== undefined) nextProfile.stageName = String(payload.stageName).trim();
    if (payload.avatarUrl !== undefined) nextProfile.avatarUrl = String(payload.avatarUrl).trim();
    if (payload.bio !== undefined) nextProfile.bio = String(payload.bio).trim();

    if (payload.teacher && typeof payload.teacher === 'object') {
      nextProfile.teacher = { ...(nextProfile.teacher || {}) };
      const teacher = payload.teacher;
      if (teacher.mainSubject !== undefined) nextProfile.teacher.mainSubject = String(teacher.mainSubject).trim();
      if (teacher.certificates !== undefined) nextProfile.teacher.certificates = String(teacher.certificates).trim();
      if (teacher.degree !== undefined) nextProfile.teacher.degree = String(teacher.degree).trim();
      if (teacher.personalRecords !== undefined) nextProfile.teacher.personalRecords = String(teacher.personalRecords).trim();
      if (teacher.teachingYears !== undefined) nextProfile.teacher.teachingYears = String(teacher.teachingYears).trim();
      if (teacher.teachingClubs !== undefined) nextProfile.teacher.teachingClubs = String(teacher.teachingClubs).trim();
      if (teacher.studentAchievements !== undefined) {
        nextProfile.teacher.studentAchievements = String(teacher.studentAchievements).trim();
      }
      if (teacher.philosophy !== undefined) nextProfile.teacher.philosophy = String(teacher.philosophy).trim();
      if (teacher.phone !== undefined) nextProfile.teacher.phone = String(teacher.phone).trim();
      if (teacher.email !== undefined) nextProfile.teacher.email = String(teacher.email).trim();
      if (teacher.fanpage !== undefined) nextProfile.teacher.fanpage = String(teacher.fanpage).trim();
      if (teacher.address !== undefined) nextProfile.teacher.address = String(teacher.address).trim();
    }

    if (payload.student && typeof payload.student === 'object') {
      nextProfile.student = { ...(nextProfile.student || {}) };
      const student = payload.student;
      if (student.dob !== undefined) nextProfile.student.dob = String(student.dob).trim();
      if (student.className !== undefined) nextProfile.student.className = String(student.className).trim();
      if (student.strengths !== undefined) nextProfile.student.strengths = String(student.strengths).trim();
      if (student.goalsShort !== undefined) nextProfile.student.goalsShort = String(student.goalsShort).trim();
      if (student.goalsLong !== undefined) nextProfile.student.goalsLong = String(student.goalsLong).trim();
      if (student.teacherNote !== undefined) nextProfile.student.teacherNote = String(student.teacherNote).trim();
    }

    user.profile = nextProfile;
    await user.save();

    const profilePayload = await buildPublicProfile(user.toObject());
    res.json({ message: 'Đã cập nhật hồ sơ.', user: profilePayload });
  } catch (error) {
    console.error('Loi cap nhat profile:', error);
    res.status(500).json({ message: 'Không cập nhật được hồ sơ.' });
  }
};

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
