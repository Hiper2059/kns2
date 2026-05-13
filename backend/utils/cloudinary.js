const { v2: cloudinary } = require('cloudinary');
const config = require('../config/env');

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

module.exports = { cloudinary };
