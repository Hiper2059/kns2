const bcrypt = require('bcryptjs');
const config = require('../config/env');
const User = require('../models/User');
const ForumPost = require('../models/ForumPost');

const defaultForumPosts = [
  {
    author: 'Hải Đăng',
    category: 'Tài chính',
    title: 'Cách quản lý chi tiêu cho sinh viên năm nhất?',
    content: 'Tháng nào mình cũng nhẵn túi, xin cao nhân chỉ giáo...'
  },
  {
    author: 'Minh Anh',
    category: 'Giao tiếp',
    title: 'Làm sao để bớt run khi thuyết trình?',
    content: 'Mỗi lần lên bục là tim mình đập loạn nhịp...'
  }
];

const seedDefaultForumPosts = async () => {
  const hasAny = await ForumPost.exists({});
  if (hasAny) {
    return;
  }

  await ForumPost.insertMany(defaultForumPosts);
};

const ensureAdminUser = async () => {
  const existingAdmin = await User.findOne({ username: config.adminUsername });
  if (existingAdmin) {
    let shouldSave = false;

    if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin';
      shouldSave = true;
    }

    if (!existingAdmin.passwordHash) {
      existingAdmin.passwordHash = await bcrypt.hash(config.adminPassword, 10);
      shouldSave = true;
    }

    if (existingAdmin.status !== 'active') {
      existingAdmin.status = 'active';
      shouldSave = true;
    }

    if ((existingAdmin.violationCount || 0) !== 0) {
      existingAdmin.violationCount = 0;
      shouldSave = true;
    }

    if (existingAdmin.lastViolationAt) {
      existingAdmin.lastViolationAt = null;
      shouldSave = true;
    }

    if (shouldSave) {
      await existingAdmin.save();
    }

    await User.updateOne({ _id: existingAdmin._id }, { $unset: { password: '' } });
    return;
  }

  const passwordHash = await bcrypt.hash(config.adminPassword, 10);
  await User.create({
    username: config.adminUsername,
    passwordHash,
    role: 'admin'
  });
  console.log('Da tao tai khoan admin mac dinh.');
};

module.exports = {
  ensureAdminUser,
  seedDefaultForumPosts
};
