const mongoose = require('mongoose');
const { connectDatabase } = require('../../config/database');
const User = require('../models/User');
const { ensureUserProfile } = require('../services/userProfileService');

const migrateUserProfiles = async () => {
  await connectDatabase();

  const users = await User.find({}).lean();
  let migrated = 0;

  for (const user of users) {
    await ensureUserProfile(user, user.profile || {});
    migrated += 1;
  }

  console.log(`Migrated user profiles: ${migrated}`);
};

if (require.main === module) {
  migrateUserProfiles()
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migrate user profiles failed:', error);
      mongoose.disconnect().finally(() => process.exit(1));
    });
}

module.exports = { migrateUserProfiles };
