require('dotenv').config();

const requireEnv = key => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} chua duoc cau hinh trong file .env`);
  }
  return value;
};

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: requireEnv('MONGODB_URI'),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'kns'
  },
  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    signatureSecret: requireEnv('JWT_SIGNATURE_SECRET'),
    accessTtl: '15m',
    refreshTtl: '7d',
    signatureTtl: '30d'
  }
};

module.exports = config;
