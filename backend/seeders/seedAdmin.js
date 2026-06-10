const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDatabase } = require('../../config/database');
const config = require('../config/env');
const User = require('../models/User');

const seedAdmin = async () => {
  const username = String(config.adminUsername || '').trim();
  const password = String(config.adminPassword || '');

  if (!username || !password) {
    throw new Error('ADMIN_USERNAME va ADMIN_PASSWORD can duoc cau hinh.');
  }

  if (password.length < 6) {
    throw new Error('ADMIN_PASSWORD can toi thieu 6 ky tu.');
  }

  await connectDatabase();

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await User.findOneAndUpdate(
    { username },
    {
      $set: {
        username,
        passwordHash,
        role: 'admin',
        status: 'active',
        violationCount: 0,
        lastViolationAt: null
      },
      $unset: { password: '' }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  console.log(`Admin user ready: ${admin.username} (${admin._id})`);
};

if (require.main === module) {
  seedAdmin()
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Seed admin that bai:', error);
      mongoose.disconnect().finally(() => process.exit(1));
    });
}

module.exports = { seedAdmin };
