const { connectDatabase } = require('../../config/database');
const {
  ensureAdminUser,
  seedDefaultForumPosts,
  seedDefaultVideoLinks
} = require('../services/seedService');

const runSeed = async () => {
  try {
    await connectDatabase();
    await ensureAdminUser();
    await seedDefaultVideoLinks();
    await seedDefaultForumPosts();
    console.log('Seed data thanh cong.');
    process.exit(0);
  } catch (error) {
    console.error('Seed data that bai:', error);
    process.exit(1);
  }
};

runSeed();
