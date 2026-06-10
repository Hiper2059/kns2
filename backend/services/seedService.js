const bcrypt = require('bcryptjs');
const config = require('../config/env');
const User = require('../models/User');
const ForumPost = require('../models/ForumPost');
const VideoLink = require('../models/VideoLink');

const defaultCategoryVideos = {
  'Võ thuật': [
    'https://www.youtube.com/embed/5_9Q52gE1yI',
    'https://www.youtube.com/embed/2X0p7k1G_L8'
  ],
  'Giao tiếp': [
    'https://www.youtube.com/embed/HAnw168huqA',
    'https://www.youtube.com/embed/t6zicFwR8jU'
  ],
  'Quản lý thời gian': ['https://www.youtube.com/embed/iONDebHX9qk'],
  'Tài chính': ['https://www.youtube.com/embed/4j2emwRkeEE'],
  'Tư duy': ['https://www.youtube.com/embed/fD1512_XJEw']
};

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

const seedDefaultVideoLinks = async () => {
  const hasAny = await VideoLink.exists({});
  if (hasAny) {
    return;
  }

  const seedPayload = [];
  for (const [category, urls] of Object.entries(defaultCategoryVideos)) {
    for (const url of urls) {
      seedPayload.push({
        category,
        url,
        addedBy: config.adminUsername
      });
    }
  }

  if (seedPayload.length) {
    await VideoLink.insertMany(seedPayload);
  }
};

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
  seedDefaultForumPosts,
  seedDefaultVideoLinks
};
