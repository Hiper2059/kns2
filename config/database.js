const mongoose = require('mongoose');
const config = require('../backend/config/env');

const connectDatabase = async () => {
  if (!config.mongoUri) {
    throw new Error('MONGODB_URI chua duoc cau hinh trong file .env');
  }

  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 30000
  });
  console.log('Da ket noi MongoDB thanh cong.');
};

module.exports = { connectDatabase };
