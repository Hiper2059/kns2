const config = require('./env');

const normalizeOrigin = value => (value || '').trim().replace(/\/$/, '');

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wildcardToRegex = pattern => {
  const escaped = escapeRegex(pattern).replace(/\\\*/g, '.*');
  return new RegExp(`^${escaped}$`);
};

const configuredOrigins = (config.frontendOrigin || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOrigins = configuredOrigins.filter(origin => !origin.includes('*'));
const allowedOriginRegexes = configuredOrigins
  .filter(origin => origin.includes('*'))
  .map(wildcardToRegex);

const isAllowedOrigin = requestOrigin =>
  allowedOrigins.includes(requestOrigin) ||
  allowedOriginRegexes.some(regex => regex.test(requestOrigin));

const corsOptions = {
  origin(origin, callback) {
    const requestOrigin = normalizeOrigin(origin);
    if (!requestOrigin || isAllowedOrigin(requestOrigin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin khong duoc phep boi CORS.'));
  }
};

module.exports = corsOptions;
