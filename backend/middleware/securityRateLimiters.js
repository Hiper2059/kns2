const { rateLimit } = require('express-rate-limit');

const buildLimiter = ({ windowMs, limit, message }) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message }
});

const authRateLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Bạn thử đăng nhập quá nhiều lần. Vui lòng chờ 15 phút.'
});

const chatRateLimiter = buildLimiter({
  windowMs: 60 * 1000,
  limit: 20,
  message: 'Bạn gửi tin nhắn quá nhanh. Vui lòng chờ một chút.'
});

module.exports = { authRateLimiter, chatRateLimiter };
