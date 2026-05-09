require('dotenv').config();

const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || '',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    signatureSecret: process.env.JWT_SIGNATURE_SECRET || 'dev_signature_secret',
    accessTtl: '15m',
    refreshTtl: '7d',
    signatureTtl: '30d'
  }
};

module.exports = config;
