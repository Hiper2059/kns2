const app = require('./app');
const config = require('./config/env');
const { connectDatabase } = require('../config/database');
const { seedDefaultForumPosts } = require('./services/seedService');
const validateSecurityConfig = require('./config/validateSecurityConfig');

const startServer = async () => {
  try {
    validateSecurityConfig(config);
    await connectDatabase();
    await seedDefaultForumPosts();
    app.listen(config.port, () => console.log(`Server Backend đang chạy ở cổng ${config.port}`));
  } catch (error) {
    console.error('Khong the khoi dong server:', error);
    process.exit(1);
  }
};

startServer();
