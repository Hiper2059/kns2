const app = require('./app');
const config = require('./config/env');
const { connectDatabase } = require('../config/database');
const { ensureAdminUser, seedDefaultForumPosts, seedDefaultVideoLinks } = require('./services/seedService');

const startServer = async () => {
  try {
    await connectDatabase();
    await ensureAdminUser();
    await seedDefaultVideoLinks();
    await seedDefaultForumPosts();
    app.listen(config.port, () => console.log(`Server Backend đang chạy ở cổng ${config.port}`));
  } catch (error) {
    console.error('Khong the khoi dong server:', error);
    process.exit(1);
  }
};

startServer();
