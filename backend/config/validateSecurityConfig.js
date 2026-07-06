const validateSecurityConfig = config => {
  if (config.nodeEnv !== 'production') return;
  if (config.adminPassword === 'admin123') {
    throw new Error('ADMIN_PASSWORD khong duoc dung gia tri mac dinh o production.');
  }
  const secrets = [config.jwt.accessSecret, config.jwt.refreshSecret, config.jwt.signatureSecret];
  if (new Set(secrets).size !== secrets.length) {
    throw new Error('Cac JWT secret phai khac nhau o production.');
  }
};

module.exports = validateSecurityConfig;
